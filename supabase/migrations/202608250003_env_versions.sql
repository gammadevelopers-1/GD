-- Three gaps the version-based Technical tab needs.
--
-- 1. A member could not see the fingerprint of their own variable. The merge
--    preview is the only thing that reads value_digest and it was owner-only,
--    so getCopyVariables returned a placeholder and a member had no way to tell
--    whether the value they hold matches the one in main. A digest of your own
--    secret tells you nothing you do not already know, so the preview now also
--    answers for the caller's own copies -- and nobody else's.
--
-- 2. There was no way to move a variable between groups: renaming a group was
--    the only reorganisation available, so a key filed in the wrong place had
--    to be deleted and retyped, which means retyping the secret.
--
-- 3. Deleting a whole version meant archiving each group by hand, and left main
--    keys pointing at credentials that no longer resolve.

-- ---------------------------------------------------------------------------
-- 1. A member sees the digests of their own copies
-- ---------------------------------------------------------------------------

create or replace function public.app_env_merge_preview(target_project_id uuid)
returns table (
  variable_name text,
  credential_id uuid,
  env_group_id uuid,
  env_group_name text,
  copy_kind text,
  profile_id uuid,
  profile_name text,
  value_digest text,
  is_main boolean,
  main_source_credential_id uuid,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    cred.name,
    cred.id,
    grp.id,
    grp.name,
    grp.kind,
    coalesce(grp.owner_profile_id, cred.created_by),
    coalesce(person.display_name, person.full_name),
    secret.value_digest,
    grp.kind = 'main',
    cred.source_credential_id,
    cred.updated_at
  from public.app_project_credentials cred
  join public.app_env_groups grp on grp.id = cred.env_group_id
  left join public.app_credential_secrets secret on secret.credential_id = cred.id
  left join public.app_profiles person
    on person.id = coalesce(grp.owner_profile_id, cred.created_by)
  where cred.project_id = target_project_id
    and cred.archived_at is null
    and grp.archived_at is null
    and (
      (select private.is_owner())
      or (
        grp.kind = 'personal'
        and grp.owner_profile_id = (select auth.uid())
      )
    )
  order by cred.name, grp.kind desc, person.full_name
$$;

comment on function public.app_env_merge_preview(uuid)
is 'One row per variable per copy, carrying a digest rather than a value. An owner sees every copy; anyone else sees only their own, which tells them nothing about a secret they already hold.';

-- ---------------------------------------------------------------------------
-- 2. Move a variable between groups without retyping its value
-- ---------------------------------------------------------------------------

create or replace function public.app_move_env_variable(
  target_credential_id uuid,
  target_group_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_group record;
  destination record;
begin
  select
    grp.id,
    grp.name,
    grp.kind,
    grp.project_id,
    grp.owner_profile_id,
    cred.name as variable_name
  into source_group
  from public.app_project_credentials cred
  join public.app_env_groups grp on grp.id = cred.env_group_id
  where cred.id = target_credential_id
    and cred.archived_at is null;

  if source_group.id is null then
    raise exception 'That variable no longer exists.' using errcode = 'P0001';
  end if;

  select * into destination
  from public.app_env_groups grp
  where grp.id = target_group_id
    and grp.archived_at is null;

  if destination.id is null then
    raise exception 'That group no longer exists.' using errcode = 'P0001';
  end if;

  if destination.project_id is distinct from source_group.project_id then
    raise exception 'A variable cannot move to another project.'
      using errcode = 'P0001';
  end if;

  if destination.kind is distinct from source_group.kind
     or destination.owner_profile_id is distinct from source_group.owner_profile_id
  then
    raise exception 'A variable can only move between groups in the same version.'
      using errcode = 'P0001';
  end if;

  if not (
    (select private.is_owner())
    or (
      source_group.kind = 'personal'
      and source_group.owner_profile_id = (select auth.uid())
    )
  ) then
    raise exception 'You cannot move this variable.' using errcode = '42501';
  end if;

  update public.app_project_credentials cred
  set env_group_id = target_group_id,
      updated_at = now()
  where cred.id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id,
    'credential.metadata_updated',
    jsonb_build_object(
      'detail',
      format('Moved %L from %L to %L', source_group.variable_name, source_group.name, destination.name)
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Delete a whole version
-- ---------------------------------------------------------------------------

create or replace function public.app_delete_env_version(
  target_project_id uuid,
  target_profile_id uuid
)
returns integer
returns null on null input
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer := 0;
begin
  if not (
    (select private.is_owner())
    or target_profile_id = (select auth.uid())
  ) then
    raise exception 'You cannot delete this version.' using errcode = '42501';
  end if;

  update public.app_project_credentials cred
  set archived_at = now()
  where cred.project_id = target_project_id
    and cred.archived_at is null
    and cred.env_group_id in (
      select grp.id from public.app_env_groups grp
      where grp.project_id = target_project_id
        and grp.kind = 'personal'
        and grp.owner_profile_id = target_profile_id
        and grp.archived_at is null
    );

  get diagnostics removed = row_count;

  -- A main key sourced from this version keeps its own sealed value; only the
  -- provenance is cleared, so main still resolves and the owner is told the
  -- source is gone rather than finding a key that silently stopped working.
  update public.app_project_credentials cred
  set source_credential_id = null,
      source_profile_id = null
  where cred.project_id = target_project_id
    and cred.source_profile_id = target_profile_id;

  update public.app_env_groups grp
  set archived_at = now()
  where grp.project_id = target_project_id
    and grp.kind = 'personal'
    and grp.owner_profile_id = target_profile_id
    and grp.archived_at is null;

  return removed;
end;
$$;

revoke all on function public.app_move_env_variable(uuid, uuid) from public, anon;
revoke all on function public.app_delete_env_version(uuid, uuid) from public, anon;
grant execute on function public.app_move_env_variable(uuid, uuid) to authenticated;
grant execute on function public.app_delete_env_version(uuid, uuid) to authenticated;
