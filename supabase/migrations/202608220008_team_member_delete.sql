-- Permanently deleting a team member.
--
-- The platform archives rather than deletes, and that stays the normal path.
-- This exists for the other case: an account typed in wrong, or created and
-- never used, which an owner should be able to erase rather than keep forever
-- behind an "Archived" label.
--
-- Thirty-five foreign keys point at app_profiles and every one is ON DELETE
-- RESTRICT, so Postgres already refuses to delete anyone who has touched
-- anything. Relying on that alone would surface as error 23503 in the interface,
-- which tells an owner nothing. So the same question is asked first, in plain
-- language, and the FKs remain as the backstop underneath.
--
-- 202608220006 turned removing a project member into a real delete, and its
-- comment named the condition that made it safe: nothing referenced that table.
-- The opposite is true here, which is why this is a guarded function rather than
-- a delete policy.
--
-- One deliberate exception on the audit log. Setting a password writes a
-- 'member.activated' row through app_member_activated(), so without an exception
-- every person who completed their invitation would be undeletable and the
-- feature would never apply to anyone. That single account-lifecycle row is
-- deleted with the account it describes. Every other audit row -- credential
-- access above all -- blocks the delete outright, because that trail is what
-- makes the platform defensible and it is not ours to tidy away.

-- ---------------------------------------------------------------------------
-- Does this person have anything worth keeping?
-- ---------------------------------------------------------------------------

create or replace function private.team_member_history_reason(target uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.app_projects project
      where project.created_by = target or project.lead_id = target
    ) or exists (
      select 1 from public.app_project_members membership
      where membership.profile_id = target
         or membership.added_by = target
         or membership.archived_by = target
    ) then 'they are recorded on project work'

    when exists (
      select 1 from public.app_milestone_weeks week
      where week.completed_by = target
    ) or exists (
      select 1 from public.app_milestone_items item
      where item.assigned_to = target or item.completed_by = target
    ) or exists (
      select 1 from public.app_milestone_cards card
      where card.assigned_to = target
         or card.created_by = target
         or card.updated_by = target
    ) or exists (
      select 1 from public.app_project_idea_boards board
      where board.updated_by = target
    ) or exists (
      select 1 from public.app_project_work_boards board
      where board.updated_by = target or board.generated_by = target
    ) or exists (
      select 1 from public.app_week_idea_boards board
      where board.updated_by = target
    ) or exists (
      select 1 from public.app_card_carry_dismissals dismissal
      where dismissal.dismissed_by = target
    ) or exists (
      select 1 from public.app_project_technical_details detail
      where detail.updated_by = target
    ) then 'they have milestone or board work recorded'

    when exists (
      select 1 from public.app_project_credentials credential
      where credential.created_by = target
    ) or exists (
      select 1 from public.app_credential_secrets secret
      where secret.updated_by = target
    ) or exists (
      select 1 from public.app_credential_grants grant_row
      where grant_row.profile_id = target
         or grant_row.granted_by = target
         or grant_row.revoked_by = target
    ) or exists (
      select 1 from public.app_env_groups env_group
      where env_group.created_by = target
    ) or exists (
      select 1 from public.app_env_files env_file
      where env_file.uploaded_by = target
    ) then 'they are tied to credentials or environment files'

    when exists (
      select 1 from public.app_invoices invoice
      where invoice.created_by = target
    ) then 'they are recorded against invoices'

    when exists (
      select 1 from public.app_client_users account
      where account.created_by = target
    ) or exists (
      select 1 from public.app_project_client_access access
      where access.granted_by = target or access.revoked_by = target
    ) or exists (
      select 1 from public.app_client_registrations registration
      where registration.created_by = target
    ) or exists (
      select 1 from public.cms_pages page
      where page.created_by = target
    ) then 'they created client or CMS records'

    when exists (
      select 1 from public.app_profiles profile
      where profile.created_by = target and profile.id <> target
    ) or exists (
      select 1 from public.app_documents document
      where document.uploaded_by = target and document.profile_id <> target
    ) then 'they set up other people on the platform'

    when exists (
      select 1 from public.app_audit_logs entry
      where entry.actor_id = target
        and entry.action <> 'member.activated'
    ) then 'they have audit history'

    else null
  end
$$;

comment on function private.team_member_history_reason(uuid)
is 'Null when a person can be erased without leaving a dangling reference. Otherwise a phrase naming what holds them, written to be read by an owner.';

-- ---------------------------------------------------------------------------
-- Can this person be deleted, and why not
-- ---------------------------------------------------------------------------

-- Returns null when the delete would succeed. The screen uses it to decide
-- whether to draw the button; the delete calls it again, because a button is
-- not a permission.
create or replace function public.app_team_member_deletable(target uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_role public.app_user_role;
  other_owners integer;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can delete a team member.'
      using errcode = '42501';
  end if;

  if target = (select auth.uid()) then
    return 'you cannot delete your own account';
  end if;

  select profile.role into target_role
  from public.app_profiles profile
  where profile.id = target;

  if target_role is null then
    return 'that person no longer exists';
  end if;

  if target_role = 'owner' then
    select count(*) into other_owners
    from public.app_profiles profile
    where profile.role = 'owner'
      and profile.is_active = true
      and profile.archived_at is null
      and profile.id <> target;

    if other_owners = 0 then
      return 'they are the last owner';
    end if;
  end if;

  return (select private.team_member_history_reason(target));
end;
$$;

-- ---------------------------------------------------------------------------
-- The delete itself
-- ---------------------------------------------------------------------------

-- Returns the storage paths whose rows were removed, so the caller can clear the
-- bucket afterwards. The objects are not reachable from here, and leaving a
-- contract behind after erasing the person it belongs to would be the worst
-- possible outcome of a "permanent" delete.
create or replace function public.app_delete_team_member(target uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  blocker text;
  paths text[];
begin
  blocker := public.app_team_member_deletable(target);

  if blocker is not null then
    raise exception
      'That person cannot be deleted permanently because %. Archive them instead.',
      blocker
      using errcode = 'P0001';
  end if;

  delete from public.app_audit_logs entry
  where entry.actor_id = target
    and entry.action = 'member.activated';

  with removed as (
    delete from public.app_documents document
    where document.profile_id = target
    returning document.storage_path
  )
  select coalesce(array_agg(removed.storage_path), array[]::text[])
  into paths
  from removed;

  delete from public.app_employment_private employment
  where employment.profile_id = target;

  delete from public.app_profiles profile
  where profile.id = target;

  return paths;
end;
$$;

revoke all on function private.team_member_history_reason(uuid) from public, anon, authenticated;
revoke all on function public.app_team_member_deletable(uuid) from public, anon;
revoke all on function public.app_delete_team_member(uuid) from public, anon;
grant execute on function public.app_team_member_deletable(uuid) to authenticated;
grant execute on function public.app_delete_team_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Their documents leave storage with them
-- ---------------------------------------------------------------------------

-- The bucket had insert, select and update policies but no delete policy, so
-- until now nothing could remove a file from it. The condition deliberately does
-- not join app_documents the way the select policy does: by the time the objects
-- are removed their rows are already gone.
drop policy if exists "private_documents_owner_delete" on storage.objects;
create policy "private_documents_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'app-private-documents'
    and (select private.is_owner())
  );
