-- Chunk 3 — Project lifecycle.
--
-- Owners create and manage a project from discovery through closure without
-- opening Supabase. Two invariants belong in the database rather than in a
-- server action, because they must hold whatever writes the row:
--
--   1. Choosing a project lead gives that person access to the project.
--   2. Lifecycle changes are recorded against the person who made them.

-- 1. Lead membership -------------------------------------------------------
--
-- "Adding someone to the team is what gives them access" is the access rule for
-- the whole module. A lead who was never added to the team would be a project
-- lead who cannot open their own project, so the trigger creates or restores
-- the membership row. It never removes one: a replaced lead stays on the team
-- until an owner removes them on the Team tab.

create or replace function private.sync_project_lead_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.lead_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.lead_id is not distinct from old.lead_id then
    return new;
  end if;

  insert into public.app_project_members
    (project_id, profile_id, responsibility, added_by, archived_at)
  values (
    new.id,
    new.lead_id,
    'Project lead',
    coalesce((select auth.uid()), new.created_by),
    null
  )
  on conflict (project_id, profile_id) do update
    set archived_at = null;

  return new;
end;
$$;

create trigger app_projects_lead_membership
  after insert or update of lead_id on public.app_projects
  for each row execute function private.sync_project_lead_membership();

comment on function private.sync_project_lead_membership()
is 'Keeps the project lead on the project team, so selecting a lead always grants that person access.';

-- 2. Lifecycle audit -------------------------------------------------------
--
-- app_audit_logs has no insert policy on purpose: it is append-only and no
-- client may write to it directly. This is the single authorized way in, and
-- only an owner can call it.

create or replace function public.app_record_project_event(
  target_project_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can record a project event.'
      using errcode = '42501';
  end if;

  if action_name is null
    or btrim(action_name) = ''
    or char_length(action_name) > 64 then
    raise exception 'A project event needs a short action name.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.app_projects project where project.id = target_project_id
  ) then
    raise exception 'Unknown project.' using errcode = '23503';
  end if;

  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata)
  values (
    (select auth.uid()),
    btrim(action_name),
    'project',
    target_project_id,
    coalesce(event_metadata, '{}'::jsonb)
  );
end;
$$;

comment on function public.app_record_project_event(uuid, text, jsonb)
is 'The only write path into the append-only audit log. Owner-only. Never store secret values in the metadata.';

revoke all on function public.app_record_project_event(uuid, text, jsonb) from public;
revoke all on function public.app_record_project_event(uuid, text, jsonb) from anon;
grant execute on function public.app_record_project_event(uuid, text, jsonb) to authenticated;

-- 3. Money that stays true a year from now ---------------------------------
--
-- The stored amount, its currency and the rate on the booking date are never
-- rewritten. Conversion happens at display time only, so last year's numbers
-- cannot silently move when the rate does. The rate is recorded as PKR per one
-- USD so either direction can be shown from the same row.

comment on column public.app_project_financials.exchange_rate_to_pkr
is 'PKR per 1 USD on the booking date. Display-time conversion only — never rewritten when the rate moves.';

comment on column public.app_project_financials.value_amount
is 'The value as agreed, in value_currency. Owner-only: this table is never joined into a member response.';

create index if not exists app_projects_archived_idx
  on public.app_projects (archived_at)
  where archived_at is not null;
