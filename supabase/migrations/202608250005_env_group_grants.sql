-- Sharing main was a snapshot, not a subscription.
--
-- shareEnvGroups walked the variables that existed at that moment and wrote one
-- app_credential_grants row per variable. Anything the owner added to main
-- afterwards had no grant, so a member who had been given "the whole main env"
-- silently stopped seeing new keys, and the only repair was for the owner to
-- share again -- with no signal that it was needed.
--
-- A grant belongs to the group. Membership of main is the thing being granted,
-- so a key added to main tomorrow is covered by the grant made today.

create table if not exists public.app_env_group_grants (
  env_group_id uuid not null
    references public.app_env_groups(id) on delete cascade,
  profile_id uuid not null
    references public.app_profiles(id) on delete cascade,
  access public.app_credential_level not null default 'use',
  granted_by uuid references public.app_profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.app_profiles(id) on delete set null,
  primary key (env_group_id, profile_id)
);

create index if not exists app_env_group_grants_profile_idx
  on public.app_env_group_grants (profile_id)
  where revoked_at is null;

comment on table public.app_env_group_grants is
  'Access to a whole env group. Unlike app_credential_grants this covers variables added later, which is what "share main with a member" has to mean.';

alter table public.app_env_group_grants enable row level security;

drop policy if exists env_group_grants_select on public.app_env_group_grants;
create policy env_group_grants_select
  on public.app_env_group_grants for select
  using (
    (select private.is_owner())
    or profile_id = (select auth.uid())
  );

revoke all on table public.app_env_group_grants from anon, authenticated;
grant select on table public.app_env_group_grants to authenticated;

-- ---------------------------------------------------------------------------
-- A group grant is an access level
-- ---------------------------------------------------------------------------

create or replace function private.credential_access_level(target_credential_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  target_group_id uuid;
  credential_archived boolean;
  project_archived boolean;
  grant_level public.app_credential_level;
begin
  select credential.project_id,
         credential.env_group_id,
         credential.archived_at is not null,
         project.archived_at is not null
  into target_project_id, target_group_id, credential_archived, project_archived
  from public.app_project_credentials credential
  join public.app_projects project on project.id = credential.project_id
  where credential.id = target_credential_id;

  if target_project_id is null then
    return null;
  end if;

  if (select private.is_owner()) then
    return 'owner';
  end if;

  if credential_archived or project_archived then
    return null;
  end if;

  -- A grant is revoked when someone leaves a project, but checking membership
  -- as well means a grant row that outlived its trigger still grants nothing.
  if not (select private.is_project_member(target_project_id)) then
    return null;
  end if;

  -- Your own copy. The value is one you put there, so reading it back is not
  -- a disclosure, and it needs no grant from anybody.
  if target_group_id is not null
     and (select private.owns_env_group(target_group_id))
  then
    return 'manage';
  end if;

  select access
  into grant_level
  from public.app_credential_grants
  where credential_id = target_credential_id
    and profile_id = (select auth.uid())
    and revoked_at is null;

  if grant_level is not null then
    return grant_level::text;
  end if;

  if target_group_id is not null then
    select access
    into grant_level
    from public.app_env_group_grants
    where env_group_id = target_group_id
      and profile_id = (select auth.uid())
      and revoked_at is null;
  end if;

  if grant_level is null then
    return null;
  end if;

  return grant_level::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seeing the row, not just the value
-- ---------------------------------------------------------------------------

drop policy if exists credentials_select_allowed on public.app_project_credentials;
create policy credentials_select_allowed
  on public.app_project_credentials for select
  using (
    (select private.is_owner())
    or (select private.owns_env_group(app_project_credentials.env_group_id))
    or (
      archived_at is null
      and (select private.is_project_member(app_project_credentials.project_id))
      and (
        exists (
          select 1 from public.app_credential_grants grant_row
          where grant_row.credential_id = app_project_credentials.id
            and grant_row.profile_id = (select auth.uid())
            and grant_row.revoked_at is null
        )
        or exists (
          select 1 from public.app_env_group_grants group_grant
          where group_grant.env_group_id = app_project_credentials.env_group_id
            and group_grant.profile_id = (select auth.uid())
            and group_grant.revoked_at is null
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Granting and revoking
-- ---------------------------------------------------------------------------

create or replace function public.app_share_env_group(
  target_group_id uuid,
  target_profile_id uuid,
  new_access text default 'use'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  grp record;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can share the main environment.'
      using errcode = '42501';
  end if;

  select id, project_id, name, kind into grp
  from public.app_env_groups
  where id = target_group_id and archived_at is null;

  if grp.id is null then
    raise exception 'That group no longer exists.' using errcode = 'P0001';
  end if;

  if grp.kind <> 'main' then
    raise exception 'Only the main environment can be shared. A personal copy belongs to one person.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.app_project_members member
    where member.project_id = grp.project_id
      and member.profile_id = target_profile_id
      and member.archived_at is null
  ) then
    raise exception 'That person is not on this project.' using errcode = 'P0001';
  end if;

  insert into public.app_env_group_grants
    (env_group_id, profile_id, access, granted_by, granted_at, revoked_at, revoked_by)
  values (
    target_group_id,
    target_profile_id,
    coalesce(nullif(btrim(new_access), ''), 'use')::public.app_credential_level,
    (select auth.uid()),
    now(),
    null,
    null
  )
  on conflict (env_group_id, profile_id) do update
    set access = excluded.access,
        granted_by = excluded.granted_by,
        granted_at = now(),
        revoked_at = null,
        revoked_by = null;
end;
$$;

create or replace function public.app_revoke_env_group(
  target_group_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can change who main is shared with.'
      using errcode = '42501';
  end if;

  update public.app_env_group_grants
  set revoked_at = now(),
      revoked_by = (select auth.uid())
  where env_group_id = target_group_id
    and profile_id = target_profile_id
    and revoked_at is null;
end;
$$;

revoke all on function public.app_share_env_group(uuid, uuid, text) from public, anon;
revoke all on function public.app_revoke_env_group(uuid, uuid) from public, anon;
grant execute on function public.app_share_env_group(uuid, uuid, text) to authenticated;
grant execute on function public.app_revoke_env_group(uuid, uuid) to authenticated;
