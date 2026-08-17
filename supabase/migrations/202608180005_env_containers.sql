-- Environment variables, as containers of individually stored keys.
--
-- An ENV variable is a credential. It is a named secret that belongs to a
-- project, needs encrypting at rest, needs granting to a person, and needs its
-- reads audited — which is the credential vault, exactly. So this adds the
-- container and reuses everything else: app_credential_secrets for the
-- ciphertext, app_credential_grants for access, app_audit_logs for the trail,
-- and lib/credentials/crypto.ts for the sealing.
--
-- Building a second secret store would have meant a second encryption path, a
-- second grant model and a second audit trail to keep correct forever.

create table if not exists public.app_env_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  -- "Frontend ENV", "Backend ENV", "Root ENV" — whatever the project needs.
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 300),
  position integer not null default 0,
  archived_at timestamptz,
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists app_env_groups_project_idx
  on public.app_env_groups (project_id, position) where archived_at is null;

create trigger app_env_groups_updated
  before update on public.app_env_groups
  for each row execute function private.set_updated_at();

comment on table public.app_env_groups
is 'A named ENV container on a project. Its variables are rows in app_project_credentials, so they inherit the vault''s encryption, grants and audit.';

-- A credential may belong to a container. Loose credentials keep working.
alter table public.app_project_credentials
  add column if not exists env_group_id uuid
    references public.app_env_groups(id) on delete restrict;

create index if not exists app_credentials_env_group_idx
  on public.app_project_credentials (env_group_id) where archived_at is null;

-- DATABASE_URL can legitimately exist in both Backend ENV and Root ENV, so
-- names are unique per container rather than per project.
alter table public.app_project_credentials
  drop constraint if exists app_project_credentials_project_id_name_key;

create unique index if not exists app_credentials_unique_name
  on public.app_project_credentials (
    project_id,
    coalesce(env_group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  );

-- Demo logins are a real category of project credential and belong in the
-- vault like any other, so the environment vocabulary gains one value.
alter table public.app_project_credentials
  drop constraint if exists app_project_credentials_environment_check;

alter table public.app_project_credentials
  add constraint app_project_credentials_environment_check
  check (environment in ('production', 'staging', 'development', 'demo', 'other'));

-- ---------------------------------------------------------------------------
-- Access: containers follow the credentials they hold — owner managed.
-- ---------------------------------------------------------------------------

alter table public.app_env_groups enable row level security;

create policy "env_groups_select_allowed"
on public.app_env_groups
for select
to authenticated
using ((select private.can_work_on_project(project_id)));

create policy "env_groups_owner_insert"
on public.app_env_groups
for insert
to authenticated
with check (
  (select private.is_owner())
  and exists (
    select 1 from public.app_projects project
    where project.id = project_id and project.archived_at is null
  )
);

create policy "env_groups_owner_update"
on public.app_env_groups
for update
to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

revoke all on public.app_env_groups from public, anon;
grant select, insert, update on public.app_env_groups to authenticated;

-- ---------------------------------------------------------------------------
-- Creating a variable is creating a credential inside a container.
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
    raise exception 'Only an owner can create a credential.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_projects project
    where project.id = target_project_id and project.archived_at is null
  ) then
    raise exception 'That project is unavailable.' using errcode = '23503';
  end if;

  -- A container always belongs to the same project as the variable in it.
  if target_env_group_id is not null and not exists (
    select 1 from public.app_env_groups grp
    where grp.id = target_env_group_id
      and grp.project_id = target_project_id
      and grp.archived_at is null
  ) then
    raise exception 'That ENV container is unavailable.' using errcode = '23503';
  end if;

  if new_name is null or btrim(new_name) = '' then
    raise exception 'A credential needs a name.' using errcode = '22023';
  end if;

  if new_ciphertext is null or btrim(new_ciphertext) = ''
    or new_nonce is null or new_auth_tag is null then
    raise exception 'A credential needs an encrypted value.' using errcode = '22023';
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

revoke all on function
  public.app_create_credential(uuid, uuid, text, text, text, text, text, text, text, integer, uuid)
  from public, anon;
grant execute on function
  public.app_create_credential(uuid, uuid, text, text, text, text, text, text, text, integer, uuid)
  to authenticated;

-- Granting a whole container is the same per-credential grant, applied across
-- the container. Convenience over the existing primitive, not a new rule:
-- every row still lands in app_credential_grants and is revocable one by one.
create or replace function public.app_grant_env_group_access(
  target_env_group_id uuid,
  target_profile_id uuid,
  new_access text default 'view'
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

revoke all on function
  public.app_grant_env_group_access(uuid, uuid, text)
  from public, anon;
grant execute on function
  public.app_grant_env_group_access(uuid, uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Uploaded ENV files
-- ---------------------------------------------------------------------------

-- A .env file is every secret in one blob, so it is the most dangerous object
-- in the platform. It stays owner-only: no per-person grants, because a grant
-- on a whole file cannot be scoped to one variable.
create table if not exists public.app_env_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  env_group_id uuid references public.app_env_groups(id) on delete restrict,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 200),
  storage_path text not null unique,
  byte_size integer not null default 0 check (byte_size >= 0),
  uploaded_by uuid not null references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_env_files_project_idx
  on public.app_env_files (project_id) where archived_at is null;

comment on table public.app_env_files
is 'Uploaded .env files. Owner-only in both directions: a whole-file secret cannot be granted per variable.';

alter table public.app_env_files enable row level security;

create policy "env_files_owner_select"
on public.app_env_files
for select
to authenticated
using ((select private.is_owner()));

create policy "env_files_owner_insert"
on public.app_env_files
for insert
to authenticated
with check ((select private.is_owner()));

create policy "env_files_owner_update"
on public.app_env_files
for update
to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

revoke all on public.app_env_files from public, anon;
grant select, insert, update on public.app_env_files to authenticated;

-- Private bucket. Small, because an ENV file that is megabytes is not an ENV
-- file. Path is <project_id>/<uuid>-<name>, matching the attachment convention.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-env-files', 'app-env-files', false, 1048576)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

create policy "env_files_bucket_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'app-env-files' and (select private.is_owner()));

create policy "env_files_bucket_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'app-env-files' and (select private.is_owner()));

create policy "env_files_bucket_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'app-env-files' and (select private.is_owner()))
  with check (bucket_id = 'app-env-files' and (select private.is_owner()));

-- Adding a defaulted argument creates a second overload rather than replacing
-- the first. Two live signatures would let a ten-argument call quietly land on
-- the version that knows nothing about containers, so the old one goes.
drop function if exists public.app_create_credential(
  uuid, uuid, text, text, text, text, text, text, text, integer
);

-- The first draft typed new_access as the enum; the underlying grant function
-- takes text. Drop the stale signature so only one overload is callable.
drop function if exists public.app_grant_env_group_access(
  uuid, uuid, public.app_credential_access
);
