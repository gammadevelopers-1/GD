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

revoke all on function private.owns_env_group(uuid) from public, anon, authenticated;

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
