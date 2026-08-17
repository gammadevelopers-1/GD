-- Chunk 9, Secure credentials.
--
-- The highest-risk part of the platform, so it is built differently from
-- everything else:
--
--   * Metadata and encrypted values live in separate tables.
--   * The value table has no grants and no policies for any client role. Every
--     read and write goes through a security-definer function that rechecks
--     permission at the moment of the call and writes an audit row.
--   * The database never holds the encryption key. Ciphertext is decrypted by
--     the application with a key held in the environment, so a full dump of
--     this database yields nothing usable.
--   * Being on a project does not grant a secret. An owner grants one
--     credential to one named person, at view or edit, and revokes whenever.

create type public.app_credential_access as enum ('view', 'edit');

create table public.app_project_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  service text check (service is null or char_length(service) <= 120),
  environment text not null default 'other'
    check (environment in ('production', 'staging', 'development', 'other')),
  description text check (description is null or char_length(description) <= 500),
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

-- Separate table, no client grants at all. Only definer functions read it.
create table public.app_credential_secrets (
  credential_id uuid primary key
    references public.app_project_credentials(id) on delete restrict,
  ciphertext text not null,
  nonce text not null,
  auth_tag text not null,
  key_version integer not null check (key_version > 0),
  updated_by uuid not null references public.app_profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.app_credential_grants (
  credential_id uuid not null
    references public.app_project_credentials(id) on delete restrict,
  profile_id uuid not null references public.app_profiles(id) on delete restrict,
  access public.app_credential_access not null default 'view',
  granted_by uuid not null references public.app_profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.app_profiles(id) on delete restrict,
  primary key (credential_id, profile_id)
);

create index app_credentials_project_idx
  on public.app_project_credentials (project_id) where archived_at is null;
create index app_credential_grants_profile_idx
  on public.app_credential_grants (profile_id) where revoked_at is null;
create index app_audit_credential_idx
  on public.app_audit_logs (resource_id, occurred_at desc)
  where resource_type = 'credential';

create trigger app_credentials_updated
  before update on public.app_project_credentials
  for each row execute function private.set_updated_at();

comment on table public.app_project_credentials
is 'Credential metadata only. Never holds a secret value.';
comment on table public.app_credential_secrets
is 'Encrypted credential values. No role has any privilege here — reachable only through app_read_credential_secret and app_replace_credential_secret. The decryption key is never in this database.';
comment on table public.app_credential_grants
is 'One credential shared with one named account. Project membership does not grant a secret.';

-- Which project a credential belongs to, or null if it does not exist.
create or replace function private.credential_project(target_credential_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select project_id
  from public.app_project_credentials
  where id = target_credential_id
$$;

-- 'owner', 'edit', 'view' or null. The single source of truth for who may
-- reach a value, evaluated fresh on every call.
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
  grant_level public.app_credential_access;
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

  -- Everyone else needs a live credential on a live project.
  if credential_archived or project_archived then
    return null;
  end if;

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

-- The only writer of credential audit rows. Never called with a secret value.
create or replace function private.record_credential_event(
  target_credential_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata)
  values (
    (select auth.uid()),
    action_name,
    'credential',
    target_credential_id,
    coalesce(event_metadata, '{}'::jsonb)
  )
$$;

create or replace function private.assert_credential_owner(target_credential_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can manage credentials.' using errcode = '42501';
  end if;
  if (select private.credential_project(target_credential_id)) is null then
    raise exception 'That credential could not be found.' using errcode = '23503';
  end if;
end;
$$;

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
  new_key_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can create a credential.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_projects project
    where project.id = target_project_id and project.archived_at is null
  ) then
    raise exception 'That project is unavailable.' using errcode = '23503';
  end if;

  if new_name is null or btrim(new_name) = '' then
    raise exception 'A credential needs a name.' using errcode = '22023';
  end if;

  if new_ciphertext is null or btrim(new_ciphertext) = ''
    or new_nonce is null or new_auth_tag is null then
    raise exception 'A credential needs an encrypted value.' using errcode = '22023';
  end if;

  insert into public.app_project_credentials
    (id, project_id, name, service, environment, description, created_by)
  values (
    new_id,
    target_project_id,
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
      'name', btrim(new_name),
      'environment', coalesce(nullif(btrim(coalesce(new_environment, '')), ''), 'other')
    )
  );
end;
$$;

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
begin
  perform private.assert_credential_owner(target_credential_id);

  if new_name is null or btrim(new_name) = '' then
    raise exception 'A credential needs a name.' using errcode = '22023';
  end if;

  update public.app_project_credentials
  set name = btrim(new_name),
      service = nullif(btrim(coalesce(new_service, '')), ''),
      environment = coalesce(nullif(btrim(coalesce(new_environment, '')), ''), 'other'),
      description = nullif(btrim(coalesce(new_description, '')), '')
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id, 'credential.metadata_updated',
    jsonb_build_object('name', btrim(new_name))
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
begin
  perform private.assert_credential_owner(target_credential_id);

  update public.app_project_credentials
  set archived_at = case when archived then now() else null end
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id,
    case when archived then 'credential.archived' else 'credential.restored' end
  );
end;
$$;

-- Returns a status row rather than raising, so that a refusal is still
-- recorded. A raised exception would roll the audit row back with it.
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

  if level is null then
    perform private.record_credential_event(
      target_credential_id, 'credential.access_denied',
      jsonb_build_object('operation', 'copy')
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

  if level is null or level = 'view' then
    perform private.record_credential_event(
      target_credential_id, 'credential.access_denied',
      jsonb_build_object('operation', 'replace', 'access', coalesce(level, 'none'))
    );
    return false;
  end if;

  if new_ciphertext is null or btrim(new_ciphertext) = ''
    or new_nonce is null or new_auth_tag is null then
    raise exception 'A credential needs an encrypted value.' using errcode = '22023';
  end if;

  update public.app_credential_secrets
  set ciphertext = new_ciphertext,
      nonce = new_nonce,
      auth_tag = new_auth_tag,
      key_version = new_key_version,
      updated_by = (select auth.uid()),
      updated_at = now()
  where credential_id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id, 'credential.value_replaced',
    jsonb_build_object('access', level)
  );

  return true;
end;
$$;

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
  requested public.app_credential_access;
  existing public.app_credential_access;
begin
  perform private.assert_credential_owner(target_credential_id);
  target_project_id := (select private.credential_project(target_credential_id));

  if access_level not in ('view', 'edit') then
    raise exception 'Access is either view or edit.' using errcode = '22023';
  end if;
  requested := access_level::public.app_credential_access;

  -- A grant follows an assignment. Somebody not on the project cannot hold one.
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

create or replace function public.app_revoke_credential_access(
  target_credential_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_credential_owner(target_credential_id);

  update public.app_credential_grants
  set revoked_at = now(), revoked_by = (select auth.uid())
  where credential_id = target_credential_id
    and profile_id = target_profile_id
    and revoked_at is null;

  if found then
    perform private.record_credential_event(
      target_credential_id, 'credential.access_revoked',
      jsonb_build_object('profile_id', target_profile_id)
    );
  end if;
end;
$$;

-- Losing the project loses the secrets with it. Chunk 5 said removal connects
-- to credential revocation; this is where that happens, in the database, so it
-- holds whatever removed the assignment.
create or replace function private.revoke_grants_on_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected record;
begin
  if new.archived_at is null or old.archived_at is not null then
    return new;
  end if;

  for affected in
    with revoked as (
      update public.app_credential_grants grant_row
      set revoked_at = now(), revoked_by = coalesce((select auth.uid()), new.archived_by)
      from public.app_project_credentials credential
      where credential.id = grant_row.credential_id
        and credential.project_id = new.project_id
        and grant_row.profile_id = new.profile_id
        and grant_row.revoked_at is null
      returning grant_row.credential_id
    )
    select credential_id from revoked
  loop
    perform private.record_credential_event(
      affected.credential_id, 'credential.access_revoked',
      jsonb_build_object('profile_id', new.profile_id, 'reason', 'removed_from_project')
    );
  end loop;

  return new;
end;
$$;

create trigger app_members_revoke_credentials
  after update of archived_at on public.app_project_members
  for each row execute function private.revoke_grants_on_membership_change();

create or replace function private.revoke_grants_on_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected record;
begin
  if new.is_active = true and new.archived_at is null then
    return new;
  end if;
  if old.is_active = false or old.archived_at is not null then
    return new;
  end if;

  for affected in
    with revoked as (
      update public.app_credential_grants grant_row
      set revoked_at = now(), revoked_by = (select auth.uid())
      where grant_row.profile_id = new.id
        and grant_row.revoked_at is null
      returning grant_row.credential_id
    )
    select credential_id from revoked
  loop
    perform private.record_credential_event(
      affected.credential_id, 'credential.access_revoked',
      jsonb_build_object('profile_id', new.id, 'reason', 'account_deactivated')
    );
  end loop;

  return new;
end;
$$;

create trigger app_profiles_revoke_credentials
  after update on public.app_profiles
  for each row execute function private.revoke_grants_on_profile_change();

alter table public.app_project_credentials enable row level security;
alter table public.app_credential_secrets enable row level security;
alter table public.app_credential_grants enable row level security;

-- Members see that a credential exists, and nothing about its value.
create policy "credentials_select_allowed" on public.app_project_credentials
  for select to authenticated
  using (
    (select private.is_owner())
    or (archived_at is null and (select private.is_project_member(project_id)))
  );

-- Owners see every grant. Everyone else sees only their own.
create policy "credential_grants_select_allowed" on public.app_credential_grants
  for select to authenticated
  using (
    (select private.is_owner()) or profile_id = (select auth.uid())
  );

-- app_credential_secrets deliberately has no policy. With no grants either,
-- that means no client role can reach it under any circumstance.

revoke all on table
  public.app_project_credentials,
  public.app_credential_secrets,
  public.app_credential_grants
from anon, authenticated;

-- Not even the service key touches the encrypted values. It would still only
-- get ciphertext, but a leaked service key should not be able to truncate the
-- vault either. Everything here goes through the definer functions.
revoke all on table public.app_credential_secrets from service_role;

grant select on table
  public.app_project_credentials,
  public.app_credential_grants
to authenticated;

revoke all on function public.app_create_credential(uuid, uuid, text, text, text, text, text, text, text, integer) from public, anon;
revoke all on function public.app_update_credential_metadata(uuid, text, text, text, text) from public, anon;
revoke all on function public.app_set_credential_archived(uuid, boolean) from public, anon;
revoke all on function public.app_read_credential_secret(uuid) from public, anon;
revoke all on function public.app_replace_credential_secret(uuid, text, text, text, integer) from public, anon;
revoke all on function public.app_grant_credential_access(uuid, uuid, text) from public, anon;
revoke all on function public.app_revoke_credential_access(uuid, uuid) from public, anon;
revoke all on function private.credential_access_level(uuid) from public;
revoke all on function private.credential_project(uuid) from public;
revoke all on function private.record_credential_event(uuid, text, jsonb) from public;
revoke all on function private.assert_credential_owner(uuid) from public;

grant execute on function public.app_create_credential(uuid, uuid, text, text, text, text, text, text, text, integer) to authenticated;
grant execute on function public.app_update_credential_metadata(uuid, text, text, text, text) to authenticated;
grant execute on function public.app_set_credential_archived(uuid, boolean) to authenticated;
grant execute on function public.app_read_credential_secret(uuid) to authenticated;
grant execute on function public.app_replace_credential_secret(uuid, text, text, text, integer) to authenticated;
grant execute on function public.app_grant_credential_access(uuid, uuid, text) to authenticated;
grant execute on function public.app_revoke_credential_access(uuid, uuid) to authenticated;

comment on function public.app_read_credential_secret(uuid)
is 'Rechecks access at call time, logs the attempt either way, and returns ciphertext only. Decryption happens in the application, never here.';
comment on function public.app_replace_credential_secret(uuid, text, text, text, integer)
is 'Owner or edit grant only. Returns false and logs a denial rather than raising, so refusals survive in the audit trail.';
