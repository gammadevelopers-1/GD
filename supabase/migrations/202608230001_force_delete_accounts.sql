create or replace function private.repoint_profile_references(target uuid, heir uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref record;
begin
  for ref in
    select
      cls.relname as table_name,
      att.attname as column_name,
      att.attnotnull as required
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.app_profiles'::regclass
      and nsp.nspname = 'public'
      and array_length(con.conkey, 1) = 1
    order by cls.relname, att.attname
  loop
    if ref.required then
      execute format(
        'update public.%I set %I = $1 where %I = $2',
        ref.table_name, ref.column_name, ref.column_name
      ) using heir, target;
    else
      execute format(
        'update public.%I set %I = null where %I = $1',
        ref.table_name, ref.column_name, ref.column_name
      ) using target;
    end if;
  end loop;
end;
$$;

comment on function private.repoint_profile_references(uuid, uuid)
is 'Clears every foreign key that points at one profile. A column that may be null is nulled; a required one is reassigned to the heir, so the work survives its author.';

create or replace function public.app_force_delete_team_member(target uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  heir uuid;
  target_role public.app_user_role;
  target_name text;
  other_owners integer;
  paths text[];
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can delete a team member.'
      using errcode = '42501';
  end if;

  heir := (select auth.uid());

  if target = heir then
    raise exception 'You cannot delete your own account.'
      using errcode = 'P0001';
  end if;

  select profile.role, coalesce(profile.display_name, profile.full_name, 'a deleted member')
  into target_role, target_name
  from public.app_profiles profile
  where profile.id = target;

  if target_role is null then
    raise exception 'That person no longer exists.'
      using errcode = 'P0001';
  end if;

  if target_role = 'owner' then
    select count(*) into other_owners
    from public.app_profiles profile
    where profile.role = 'owner'
      and profile.is_active = true
      and profile.archived_at is null
      and profile.id <> target;

    if other_owners = 0 then
      raise exception 'They are the last owner, so the platform would be left with none.'
        using errcode = 'P0001';
    end if;
  end if;

  delete from public.app_notifications entry
  where entry.profile_id = target;

  delete from public.app_credential_grants grant_row
  where grant_row.profile_id = target;

  delete from public.app_project_members membership
  where membership.profile_id = target;

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

  delete from public.app_audit_logs entry
  where entry.actor_id = target
    and entry.action = 'member.activated';

  update public.app_audit_logs entry
  set metadata = coalesce(entry.metadata, '{}'::jsonb)
    || jsonb_build_object('deleted_actor', target_name)
  where entry.actor_id = target;

  perform private.repoint_profile_references(target, heir);

  delete from public.app_profiles profile
  where profile.id = target;

  return paths;
end;
$$;

comment on function public.app_force_delete_team_member(uuid)
is 'Erases a team member whatever their history. Records about them go with them; work they authored is kept and reassigned to the owner running the delete, and their audit entries keep their name in metadata.deleted_actor.';

create or replace function public.app_force_delete_client_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can delete a client account.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_client_users account where account.id = target
  ) then
    raise exception 'That account no longer exists.'
      using errcode = 'P0001';
  end if;

  update public.app_milestone_cards card
  set client_updated_by = null
  where card.client_updated_by = target;

  update public.app_week_idea_boards board
  set client_updated_by = null
  where board.client_updated_by = target;

  delete from public.app_audit_logs entry
  where entry.client_actor_id = target;

  delete from public.app_project_client_access access
  where access.client_user_id = target;

  delete from public.app_client_users account
  where account.id = target;
end;
$$;

comment on function public.app_force_delete_client_account(uuid)
is 'Erases a portal account whatever their history. Their board authorship is cleared and the work they wrote stays on the project.';

revoke all on function private.repoint_profile_references(uuid, uuid) from public, anon, authenticated;
revoke all on function public.app_force_delete_team_member(uuid) from public, anon;
revoke all on function public.app_force_delete_client_account(uuid) from public, anon;
grant execute on function public.app_force_delete_team_member(uuid) to authenticated;
grant execute on function public.app_force_delete_client_account(uuid) to authenticated;
