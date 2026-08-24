-- Personal ENV copies.
--
-- A member on a project gets their own working copy of the project's ENV. They
-- author freely inside it and nobody else on the project can read it. Owners see
-- every copy so they can settle which value the one authoritative main copy uses.
--
-- Values are still vault credentials: same encryption, same grants, same audit.
-- Postgres holds no encryption key, so equality between two copies is decided by
-- a keyed digest the application computes at seal time and stores beside the
-- ciphertext. The digest never reveals the value and is useless without the key.

alter table public.app_env_groups
  add column if not exists kind text not null default 'main'
    check (kind in ('main', 'personal'));

alter table public.app_env_groups
  add column if not exists owner_profile_id uuid
    references public.app_profiles(id) on delete restrict;

alter table public.app_env_groups
  drop constraint if exists app_env_groups_owner_matches_kind;

alter table public.app_env_groups
  add constraint app_env_groups_owner_matches_kind check (
    (kind = 'personal' and owner_profile_id is not null)
    or (kind = 'main' and owner_profile_id is null)
  );

drop index if exists app_env_groups_project_name_key;
alter table public.app_env_groups
  drop constraint if exists app_env_groups_project_id_name_key;

create unique index if not exists app_env_groups_main_name_unique
  on public.app_env_groups (project_id, name)
  where kind = 'main' and archived_at is null;

create unique index if not exists app_env_groups_personal_name_unique
  on public.app_env_groups (project_id, owner_profile_id, name)
  where kind = 'personal' and archived_at is null;

create index if not exists app_env_groups_owner_idx
  on public.app_env_groups (owner_profile_id) where archived_at is null;

comment on column public.app_env_groups.kind
is 'main is the authoritative copy and stays owner-write. personal belongs to one member and only that member and owners can read it.';

-- Provenance: which copy a main value was taken from.
alter table public.app_project_credentials
  add column if not exists source_credential_id uuid
    references public.app_project_credentials(id) on delete restrict;

alter table public.app_project_credentials
  add column if not exists source_profile_id uuid
    references public.app_profiles(id) on delete restrict;

-- Keyed digest of the plaintext, written by the application beside the ciphertext.
alter table public.app_credential_secrets
  add column if not exists value_digest text
    check (value_digest is null or value_digest ~ '^[0-9a-f]{64}$');

comment on column public.app_credential_secrets.value_digest
is 'HMAC-SHA256 of the plaintext under a key derived from the encryption key. Lets two copies be compared for equality without decrypting either.';

-- ---------------------------------------------------------------------------
-- Reach
-- ---------------------------------------------------------------------------

create or replace function private.owns_env_group(target_env_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_env_groups grp
    join public.app_project_members mem
      on mem.project_id = grp.project_id
     and mem.profile_id = (select auth.uid())
     and mem.archived_at is null
    where grp.id = target_env_group_id
      and grp.kind = 'personal'
      and grp.owner_profile_id = (select auth.uid())
      and grp.archived_at is null
  )
$$;

comment on function private.owns_env_group(uuid)
is 'True only for the caller''s own personal copy on a project they are still a live member of.';

revoke all on function private.owns_env_group(uuid) from public, anon;
grant execute on function private.owns_env_group(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

drop policy if exists "env_groups_select_allowed" on public.app_env_groups;
create policy "env_groups_select_allowed" on public.app_env_groups
for select to authenticated
using (
  archived_at is null
  and (
    (select private.is_owner())
    or (
      kind = 'personal'
      and owner_profile_id = (select auth.uid())
    )
    or (
      kind = 'main'
      and (select private.is_project_member(project_id))
    )
  )
);

drop policy if exists "env_groups_owner_insert" on public.app_env_groups;
create policy "env_groups_member_insert" on public.app_env_groups
for insert to authenticated
with check (
  (select private.is_owner() and kind = 'main')
  or (
    kind = 'personal'
    and owner_profile_id = (select auth.uid())
    and (select private.is_project_member(project_id))
  )
);

drop policy if exists "env_groups_owner_update" on public.app_env_groups;
create policy "env_groups_member_update" on public.app_env_groups
for update to authenticated
using (
  (select private.is_owner())
  or (kind = 'personal' and owner_profile_id = (select auth.uid()))
)
with check (
  (select private.is_owner())
  or (
    kind = 'personal'
    and owner_profile_id = (select auth.uid())
    and (select private.is_project_member(project_id))
  )
);

-- A member reaches a variable three ways now: it is granted to them, it is in
-- main and they are on the project, or it is in their own copy.
drop policy if exists "credentials_select_allowed" on public.app_project_credentials;
create policy "credentials_select_allowed" on public.app_project_credentials
for select to authenticated
using (
  (select private.is_owner())
  or (select private.owns_env_group(env_group_id))
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
is 'Owners see every variable. A member sees their own copy in full, plus anything granted to them. Another member''s copy returns nothing.';

drop policy if exists "credentials_member_update" on public.app_project_credentials;
create policy "credentials_member_update" on public.app_project_credentials
for update to authenticated
using ((select private.owns_env_group(env_group_id)))
with check ((select private.owns_env_group(env_group_id)));

-- ---------------------------------------------------------------------------
-- Creating a copy
-- ---------------------------------------------------------------------------

create or replace function public.app_create_personal_env_group(
  target_project_id uuid,
  new_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(coalesce(new_name, ''));
  new_id uuid;
begin
  if not exists (
    select 1 from public.app_project_members
    where project_id = target_project_id
      and profile_id = (select auth.uid())
      and archived_at is null
  ) then
    raise exception 'You are not on this project.' using errcode = '42501';
  end if;

  if char_length(clean_name) < 1 or char_length(clean_name) > 80 then
    raise exception 'A container name is 1 to 80 characters.' using errcode = '22023';
  end if;

  insert into public.app_env_groups
    (project_id, name, kind, owner_profile_id, created_by)
  values
    (target_project_id, clean_name, 'personal', (select auth.uid()), (select auth.uid()))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.app_create_personal_env_group(uuid, text) from public, anon;
grant execute on function public.app_create_personal_env_group(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Writing into your own copy
-- ---------------------------------------------------------------------------

create or replace function public.app_save_personal_env_variable(
  new_id uuid,
  target_env_group_id uuid,
  new_name text,
  new_ciphertext text,
  new_nonce text,
  new_auth_tag text,
  new_key_version integer,
  new_digest text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  grp record;
  clean_name text := btrim(coalesce(new_name, ''));
  existing_id uuid;
  target_id uuid;
begin
  if not (select private.owns_env_group(target_env_group_id)) then
    raise exception 'That copy is not yours.' using errcode = '42501';
  end if;

  select id, project_id into grp
  from public.app_env_groups where id = target_env_group_id;

  select id into existing_id
  from public.app_project_credentials
  where env_group_id = target_env_group_id
    and name = clean_name
    and archived_at is null;

  if existing_id is null then
    insert into public.app_project_credentials
      (id, project_id, env_group_id, name, environment, created_by)
    values
      (new_id, grp.project_id, target_env_group_id, clean_name, 'other', (select auth.uid()))
    returning id into target_id;
  else
    target_id := existing_id;
  end if;

  insert into public.app_credential_secrets
    (credential_id, ciphertext, nonce, auth_tag, key_version, value_digest, updated_by)
  values
    (target_id, new_ciphertext, new_nonce, new_auth_tag, new_key_version,
     new_digest, (select auth.uid()))
  on conflict (credential_id) do update
    set ciphertext = excluded.ciphertext,
        nonce = excluded.nonce,
        auth_tag = excluded.auth_tag,
        key_version = excluded.key_version,
        value_digest = excluded.value_digest,
        updated_by = excluded.updated_by,
        updated_at = now();

  perform private.record_credential_event(
    target_id,
    case when existing_id is null then 'credential.created' else 'credential.value_replaced' end,
    jsonb_build_object('copy', 'personal')
  );

  return target_id;
end;
$$;

revoke all on function public.app_save_personal_env_variable(uuid, uuid, text, text, text, text, integer, text) from public, anon;
grant execute on function public.app_save_personal_env_variable(uuid, uuid, text, text, text, text, integer, text) to authenticated;

create or replace function public.app_archive_personal_env_variable(target_credential_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  grp uuid;
begin
  select env_group_id into grp
  from public.app_project_credentials where id = target_credential_id;

  if grp is null or not (select private.owns_env_group(grp)) then
    raise exception 'That variable is not yours.' using errcode = '42501';
  end if;

  update public.app_project_credentials
  set archived_at = now()
  where id = target_credential_id and archived_at is null;

  perform private.record_credential_event(
    target_credential_id, 'credential.archived', jsonb_build_object('copy', 'personal')
  );
end;
$$;

revoke all on function public.app_archive_personal_env_variable(uuid) from public, anon;
grant execute on function public.app_archive_personal_env_variable(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Compare
--
-- Returns digests, never ciphertext and never plaintext. Two rows carrying the
-- same digest hold the same value; that is the whole comparison.
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
    and (select private.is_owner())
  order by cred.name, grp.kind desc, person.full_name
$$;

revoke all on function public.app_env_merge_preview(uuid) from public, anon;
grant execute on function public.app_env_merge_preview(uuid) to authenticated;

comment on function public.app_env_merge_preview(uuid)
is 'Owner-only. One row per variable per copy, carrying a digest rather than a value, so agreement is visible without decrypting anything.';

-- ---------------------------------------------------------------------------
-- Adopt
--
-- The sealed value is bound to its own credential id through the cipher's
-- additional data, so bytes cannot simply be copied from one row to another.
-- The application decrypts the source, reseals under the target id and passes
-- the fresh bytes in. This function owns the row, the provenance and the audit.
-- ---------------------------------------------------------------------------

create or replace function public.app_env_main_target(
  target_main_group_id uuid,
  from_credential_id uuid,
  fallback_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  main_group record;
  source_cred record;
  target_id uuid;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can change the main copy.' using errcode = '42501';
  end if;

  select id, project_id, kind into main_group
  from public.app_env_groups
  where id = target_main_group_id and archived_at is null;

  if main_group.id is null or main_group.kind <> 'main' then
    raise exception 'That is not a main container.' using errcode = '22023';
  end if;

  select id, name, project_id into source_cred
  from public.app_project_credentials
  where id = from_credential_id and archived_at is null;

  if source_cred.id is null or source_cred.project_id <> main_group.project_id then
    raise exception 'That value is not on this project.' using errcode = '22023';
  end if;

  select id into target_id
  from public.app_project_credentials
  where env_group_id = target_main_group_id
    and name = source_cred.name
    and archived_at is null;

  if target_id is null then
    insert into public.app_project_credentials
      (id, project_id, env_group_id, name, environment, created_by)
    values
      (fallback_id, main_group.project_id, target_main_group_id,
       source_cred.name, 'other', (select auth.uid()))
    returning id into target_id;
  end if;

  return target_id;
end;
$$;

revoke all on function public.app_env_main_target(uuid, uuid, uuid) from public, anon;
grant execute on function public.app_env_main_target(uuid, uuid, uuid) to authenticated;

create or replace function public.app_env_adopt_value(
  target_credential_id uuid,
  from_credential_id uuid,
  new_ciphertext text,
  new_nonce text,
  new_auth_tag text,
  new_key_version integer,
  new_digest text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_cred record;
  target_cred record;
  source_owner uuid;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can change the main copy.' using errcode = '42501';
  end if;

  select cred.id, cred.project_id, cred.env_group_id into source_cred
  from public.app_project_credentials cred
  where cred.id = from_credential_id and cred.archived_at is null;

  select cred.id, cred.project_id into target_cred
  from public.app_project_credentials cred
  where cred.id = target_credential_id and cred.archived_at is null;

  if source_cred.id is null or target_cred.id is null
     or source_cred.project_id <> target_cred.project_id then
    raise exception 'Those variables are not on the same project.' using errcode = '22023';
  end if;

  select owner_profile_id into source_owner
  from public.app_env_groups where id = source_cred.env_group_id;

  insert into public.app_credential_secrets
    (credential_id, ciphertext, nonce, auth_tag, key_version, value_digest, updated_by)
  values
    (target_credential_id, new_ciphertext, new_nonce, new_auth_tag,
     new_key_version, new_digest, (select auth.uid()))
  on conflict (credential_id) do update
    set ciphertext = excluded.ciphertext,
        nonce = excluded.nonce,
        auth_tag = excluded.auth_tag,
        key_version = excluded.key_version,
        value_digest = excluded.value_digest,
        updated_by = excluded.updated_by,
        updated_at = now();

  update public.app_project_credentials
  set source_credential_id = source_cred.id,
      source_profile_id = source_owner
  where id = target_credential_id;

  perform private.record_credential_event(
    target_credential_id,
    'credential.value_replaced',
    jsonb_build_object(
      'adopted_from_credential', source_cred.id,
      'adopted_from_profile', source_owner
    )
  );
end;
$$;

revoke all on function public.app_env_adopt_value(uuid, uuid, text, text, text, integer, text) from public, anon;
grant execute on function public.app_env_adopt_value(uuid, uuid, text, text, text, integer, text) to authenticated;
