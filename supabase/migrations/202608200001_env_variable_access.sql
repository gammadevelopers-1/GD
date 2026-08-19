-- Environment variables become the whole of the secret store, and access to one
-- is stated in three levels instead of two.
--
--   see    — the key exists. Name and note, never the value.
--   use    — everything above, plus copying the value.
--   manage — everything above, plus editing and deleting it.
--
-- Two levels could not express "knows it exists" separately from "holds it",
-- which is the distinction the share dialog is actually making. 'view' meant
-- both at once and so meant neither clearly.
--
-- The other change is that being on a project stops implying anything about
-- its variables. Previously an assigned member could list every credential
-- name on the project. Now a grant is the only thing that reveals a variable,
-- at any level.

-- ---------------------------------------------------------------------------
-- Every variable belongs to exactly one group
-- ---------------------------------------------------------------------------

-- Credentials predating groups sat loose on the project and were shown in a
-- separate panel. One home per variable means they need a group, so each
-- project that has any gets one called General.
insert into public.app_env_groups (project_id, name, position, created_by)
select distinct on (credential.project_id)
  credential.project_id,
  'General',
  coalesce(
    (select max(existing.position) + 1
     from public.app_env_groups existing
     where existing.project_id = credential.project_id),
    0
  ),
  credential.created_by
from public.app_project_credentials credential
where credential.env_group_id is null
  and not exists (
    select 1 from public.app_env_groups clash
    where clash.project_id = credential.project_id and clash.name = 'General'
  )
order by credential.project_id, credential.created_at;

update public.app_project_credentials credential
set env_group_id = grp.id
from public.app_env_groups grp
where credential.env_group_id is null
  and grp.project_id = credential.project_id
  and grp.name = 'General';

alter table public.app_project_credentials
  alter column env_group_id set not null;

comment on column public.app_project_credentials.env_group_id
is 'The group this variable belongs to. Exactly one, always.';

-- The unique index coalesced a null group to a sentinel uuid. With the column
-- not null that branch is dead, so the index says what it means.
drop index if exists public.app_credentials_unique_name;

create unique index if not exists app_credentials_unique_name
  on public.app_project_credentials (env_group_id, name);

-- ---------------------------------------------------------------------------
-- Three access levels
-- ---------------------------------------------------------------------------

-- A new type rather than `alter type ... add value`, because a value added in
-- a migration cannot be used by the same transaction that adds it.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_credential_level') then
    create type public.app_credential_level as enum ('see', 'use', 'manage');
  end if;
end;
$$;

alter table public.app_credential_grants
  alter column access drop default;

alter table public.app_credential_grants
  alter column access type public.app_credential_level
  using (
    case access::text
      when 'edit' then 'manage'
      when 'view' then 'use'
      else access::text
    end
  )::public.app_credential_level;

alter table public.app_credential_grants
  alter column access set default 'use';

comment on column public.app_credential_grants.access
is 'see, use or manage. Granted per variable to one person — never to a link.';

-- ---------------------------------------------------------------------------
-- Who may do what, resolved fresh on every call
-- ---------------------------------------------------------------------------

-- 'owner', 'manage', 'use', 'see' or null.
create or replace function private.credential_access_level(target_credential_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  credential_archived boolean;
  project_archived boolean;
  grant_level public.app_credential_level;
begin
  select credential.project_id,
         credential.archived_at is not null,
         project.archived_at is not null
  into target_project_id, credential_archived, project_archived
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

  select access
  into grant_level
  from public.app_credential_grants
  where credential_id = target_credential_id
    and profile_id = (select auth.uid())
    and revoked_at is null;

  if grant_level is null then
    return null;
  end if;

  return grant_level::text;
end;
$$;

-- Editing and deleting are the same bar: owner anywhere, or a manage grant.
create or replace function private.assert_credential_manager(target_credential_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  level text;
begin
  if (select private.credential_project(target_credential_id)) is null then
    raise exception 'That variable could not be found.' using errcode = '23503';
  end if;

  level := (select private.credential_access_level(target_credential_id));

  if level is null or level not in ('owner', 'manage') then
    raise exception 'You cannot change this variable.' using errcode = '42501';
  end if;

  return level;
end;
$$;

revoke execute on function private.assert_credential_manager(uuid) from public, anon;
grant execute on function private.assert_credential_manager(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Reading a value
-- ---------------------------------------------------------------------------

-- Still returns a status row rather than raising, so a refusal is recorded
-- instead of being rolled back with the exception.
create or replace function public.app_read_credential_secret(target_credential_id uuid)
returns table (
  allowed boolean,
  access text,
  ciphertext text,
  nonce text,
  auth_tag text,
  key_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  level text;
begin
  level := (select private.credential_access_level(target_credential_id));

  -- 'see' reaches here: it is enough to know the variable exists, and not
  -- enough to hold it. The refusal is worth auditing precisely because the
  -- person had some access and asked for more.
  if level is null or level not in ('owner', 'manage', 'use') then
    perform private.record_credential_event(
      target_credential_id, 'credential.access_denied',
      jsonb_build_object('operation', 'copy', 'access', coalesce(level, 'none'))
    );
    return query select false, null::text, null::text, null::text, null::text, null::integer;
    return;
  end if;

  perform private.record_credential_event(
    target_credential_id, 'credential.secret_copied',
    jsonb_build_object('access', level)
  );

  return query
    select true,
           level,
           secret.ciphertext,
           secret.nonce,
           secret.auth_tag,
           secret.key_version
    from public.app_credential_secrets secret
    where secret.credential_id = target_credential_id;
end;
$$;

create or replace function public.app_replace_credential_secret(
  target_credential_id uuid,
  new_ciphertext text,
  new_nonce text,
  new_auth_tag text,
  new_key_version integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  level text;
begin
  level := (select private.credential_access_level(target_credential_id));

  if level is null or level not in ('owner', 'manage') then
    perform private.record_credential_event(
      target_credential_id, 'credential.access_denied',
      jsonb_build_object('operation', 'replace', 'access', coalesce(level, 'none'))
    );
    return false;
  end if;

  if new_ciphertext is null or btrim(new_ciphertext) = ''
    or new_nonce is null or new_auth_tag is null then
    raise exception 'A variable needs an encrypted value.' using errcode = '22023';
  end if;

  update public.app_credential_secrets
  set ciphertext = new_ciphertext,
      nonce = new_nonce,
      auth_tag = new_auth_tag,
      key_version = new_key_version,
      updated_by = (select auth.uid()),
      updated_at = now()
  where credential_id = target_credential_id;

  update public.app_project_credentials
  set updated_at = now()
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id, 'credential.value_replaced',
    jsonb_build_object('access', level)
  );

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Editing and deleting
-- ---------------------------------------------------------------------------

create or replace function public.app_update_credential_metadata(
  target_credential_id uuid,
  new_name text,
  new_service text,
  new_environment text,
  new_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  level text;
begin
  level := (select private.assert_credential_manager(target_credential_id));

  if new_name is null or btrim(new_name) = '' then
    raise exception 'A variable needs a key.' using errcode = '22023';
  end if;

  update public.app_project_credentials
  set name = btrim(new_name),
      service = nullif(btrim(coalesce(new_service, '')), ''),
      environment = coalesce(nullif(btrim(coalesce(new_environment, '')), ''), 'other'),
      description = nullif(btrim(coalesce(new_description, '')), '')
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id, 'credential.metadata_updated',
    jsonb_build_object('name', btrim(new_name), 'access', level)
  );
end;
$$;

create or replace function public.app_set_credential_archived(
  target_credential_id uuid,
  archived boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  level text;
begin
  level := (select private.assert_credential_manager(target_credential_id));

  update public.app_project_credentials
  set archived_at = case when archived then now() else null end
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id,
    case when archived then 'credential.archived' else 'credential.restored' end,
    jsonb_build_object('access', level)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Granting
-- ---------------------------------------------------------------------------

create or replace function public.app_grant_credential_access(
  target_credential_id uuid,
  target_profile_id uuid,
  access_level text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  requested public.app_credential_level;
  existing public.app_credential_level;
begin
  -- Granting stays owner-only. A manage grant lets someone change a variable,
  -- not widen who else can reach it.
  perform private.assert_credential_owner(target_credential_id);
  target_project_id := (select private.credential_project(target_credential_id));

  if access_level not in ('see', 'use', 'manage') then
    raise exception 'Access is see, use or manage.' using errcode = '22023';
  end if;
  requested := access_level::public.app_credential_level;

  if not exists (
    select 1
    from public.app_project_members member
    join public.app_profiles profile on profile.id = member.profile_id
    where member.project_id = target_project_id
      and member.profile_id = target_profile_id
      and member.archived_at is null
      and profile.is_active = true
      and profile.archived_at is null
  ) then
    raise exception 'That person is not on this project.' using errcode = '23514';
  end if;

  select access into existing
  from public.app_credential_grants
  where credential_id = target_credential_id
    and profile_id = target_profile_id
    and revoked_at is null;

  insert into public.app_credential_grants
    (credential_id, profile_id, access, granted_by, granted_at, revoked_at, revoked_by)
  values (
    target_credential_id, target_profile_id, requested,
    (select auth.uid()), now(), null, null
  )
  on conflict (credential_id, profile_id) do update
  set access = excluded.access,
      granted_by = excluded.granted_by,
      granted_at = now(),
      revoked_at = null,
      revoked_by = null;

  perform private.record_credential_event(
    target_credential_id,
    case
      when existing is null then 'credential.access_granted'
      when existing <> requested then 'credential.access_level_changed'
      else 'credential.access_granted'
    end,
    jsonb_build_object(
      'profile_id', target_profile_id,
      'access', access_level,
      'previous_access', existing
    )
  );
end;
$$;

create or replace function public.app_grant_env_group_access(
  target_env_group_id uuid,
  target_profile_id uuid,
  new_access text default 'use'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  granted integer := 0;
  credential_row record;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can grant access.' using errcode = '42501';
  end if;

  for credential_row in
    select credential.id
    from public.app_project_credentials credential
    where credential.env_group_id = target_env_group_id
      and credential.archived_at is null
  loop
    perform public.app_grant_credential_access(
      credential_row.id, target_profile_id, new_access
    );
    granted := granted + 1;
  end loop;

  return granted;
end;
$$;

-- ---------------------------------------------------------------------------
-- Creating requires a group
-- ---------------------------------------------------------------------------

create or replace function public.app_create_credential(
  new_id uuid,
  target_project_id uuid,
  new_name text,
  new_service text,
  new_environment text,
  new_description text,
  new_ciphertext text,
  new_nonce text,
  new_auth_tag text,
  new_key_version integer,
  target_env_group_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can add a variable.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_projects project
    where project.id = target_project_id and project.archived_at is null
  ) then
    raise exception 'That project is unavailable.' using errcode = '23503';
  end if;

  if target_env_group_id is null then
    raise exception 'A variable needs a group.' using errcode = '23502';
  end if;

  if not exists (
    select 1 from public.app_env_groups grp
    where grp.id = target_env_group_id
      and grp.project_id = target_project_id
      and grp.archived_at is null
  ) then
    raise exception 'That group is unavailable.' using errcode = '23503';
  end if;

  if new_name is null or btrim(new_name) = '' then
    raise exception 'A variable needs a key.' using errcode = '22023';
  end if;

  if new_ciphertext is null or btrim(new_ciphertext) = ''
    or new_nonce is null or new_auth_tag is null then
    raise exception 'A variable needs an encrypted value.' using errcode = '22023';
  end if;

  insert into public.app_project_credentials
    (id, project_id, env_group_id, name, service, environment, description, created_by)
  values (
    new_id,
    target_project_id,
    target_env_group_id,
    btrim(new_name),
    nullif(btrim(coalesce(new_service, '')), ''),
    coalesce(nullif(btrim(coalesce(new_environment, '')), ''), 'other'),
    nullif(btrim(coalesce(new_description, '')), ''),
    (select auth.uid())
  );

  insert into public.app_credential_secrets
    (credential_id, ciphertext, nonce, auth_tag, key_version, updated_by)
  values (
    new_id, new_ciphertext, new_nonce, new_auth_tag, new_key_version,
    (select auth.uid())
  );

  perform private.record_credential_event(
    new_id,
    'credential.created',
    jsonb_build_object(
      'project_id', target_project_id,
      'env_group_id', target_env_group_id,
      'name', btrim(new_name),
      'environment', coalesce(nullif(btrim(coalesce(new_environment, '')), ''), 'other')
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- A grant is the only thing that reveals a variable
-- ---------------------------------------------------------------------------

drop policy if exists "credentials_select_allowed" on public.app_project_credentials;

create policy "credentials_select_allowed" on public.app_project_credentials
  for select to authenticated
  using (
    (select private.is_owner())
    or (
      archived_at is null
      and (select private.is_project_member(project_id))
      and exists (
        select 1
        from public.app_credential_grants grant_row
        where grant_row.credential_id = id
          and grant_row.profile_id = (select auth.uid())
          and grant_row.revoked_at is null
      )
    )
  );

comment on policy "credentials_select_allowed" on public.app_project_credentials
is 'Owners see every variable. Everyone else sees only the ones granted to them, at any level.';

-- The old two-value type is now unreferenced.
drop type if exists public.app_credential_access;
