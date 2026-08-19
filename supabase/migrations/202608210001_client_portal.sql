-- The client portal: the first time an account outside the company can sign in.
--
-- The whole design rests on one decision: a client is NOT an app_profiles row.
--
-- Every existing policy in this database is written in terms of
-- private.is_owner(), private.is_finance() or private.is_project_member(), and
-- all three resolve through private.current_app_role(), which reads
-- app_profiles. A client has no row there, so current_app_role() returns null
-- and all three return false. That makes "deny by default" a property of the
-- schema rather than a promise about policies — a table added next year is
-- closed to clients before anybody writes a policy for it.
--
-- Clients therefore get no select policy on any table, not even a filtered one.
-- Everything the portal renders comes from one security definer function,
-- app_client_portal(), which is the entire allowlist in one reviewable place.

-- ---------------------------------------------------------------------------
-- Who a client is
-- ---------------------------------------------------------------------------

create table if not exists public.app_client_users (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  full_name text not null default '',
  avatar_url text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_client_users
is 'External client accounts. Deliberately not app_profiles: a client must never satisfy is_owner, is_finance or is_project_member.';

create trigger app_client_users_updated
  before update on public.app_client_users
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create table if not exists public.app_project_client_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  -- Stored lowercased; the accept path compares against the verified Google
  -- address exactly, with no normalising beyond this.
  email text not null check (position('@' in email) > 1),
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists app_client_invites_pending_idx
  on public.app_project_client_invites (project_id, email)
  where accepted_at is null and revoked_at is null;

create index if not exists app_client_invites_email_idx
  on public.app_project_client_invites (email)
  where accepted_at is null and revoked_at is null;

-- ---------------------------------------------------------------------------
-- The link that grants access. Nothing else grants it.
-- ---------------------------------------------------------------------------

create table if not exists public.app_project_client_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  client_user_id uuid not null references public.app_client_users(id) on delete restrict,
  granted_by uuid references public.app_profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.app_profiles(id) on delete restrict,
  last_seen_at timestamptz,
  unique (project_id, client_user_id)
);

create index if not exists app_client_access_live_idx
  on public.app_project_client_access (client_user_id)
  where revoked_at is null;

comment on table public.app_project_client_access
is 'One row per client per project. Revoking sets revoked_at and takes effect on the next request, because every read rechecks it.';

-- ---------------------------------------------------------------------------
-- What is shared. Every switch starts off.
-- ---------------------------------------------------------------------------

create table if not exists public.app_project_client_settings (
  project_id uuid primary key references public.app_projects(id) on delete restrict,
  share_ideaboard boolean not null default false,
  share_staging boolean not null default false,
  share_design boolean not null default false,
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  contact_email text check (contact_email is null or char_length(contact_email) <= 200),
  updated_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_project_client_settings
is 'Per-project sharing switches. Absent row means every switch is off, so sharing is always a decision rather than a default.';

create trigger app_project_client_settings_updated
  before update on public.app_project_client_settings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Deliverables
-- ---------------------------------------------------------------------------

create table if not exists public.app_project_client_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 200),
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  byte_size integer not null default 0 check (byte_size >= 0),
  -- Uploading is not sharing. An owner marks each file separately.
  client_visible boolean not null default false,
  uploaded_by uuid not null references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_client_files_project_idx
  on public.app_project_client_files (project_id) where archived_at is null;

-- ---------------------------------------------------------------------------
-- Audit. A client action is logged the same way an internal one is.
-- ---------------------------------------------------------------------------

alter table public.app_audit_logs
  add column if not exists client_actor_id uuid
    references public.app_client_users(id) on delete restrict;

comment on column public.app_audit_logs.client_actor_id
is 'Set instead of actor_id when an external client account did the thing. actor_id references app_profiles, which a client deliberately has no row in.';

create index if not exists app_audit_client_actor_idx
  on public.app_audit_logs (client_actor_id, occurred_at desc)
  where client_actor_id is not null;

create or replace function private.record_client_event(
  target_project_id uuid,
  event_action text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, client_actor_id, action, resource_type, resource_id, metadata)
  values (
    null,
    (select auth.uid()),
    event_action,
    'client_portal',
    target_project_id,
    coalesce(event_metadata, '{}'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Identity helpers
-- ---------------------------------------------------------------------------

create or replace function private.is_client_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_client_users
    where id = (select auth.uid()) and archived_at is null
  )
$$;

-- The only question that grants a client anything, asked fresh every time.
create or replace function private.is_client_of(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_project_client_access access
    join public.app_client_users account on account.id = access.client_user_id
    join public.app_projects project on project.id = access.project_id
    where access.project_id = target_project_id
      and access.client_user_id = (select auth.uid())
      and access.revoked_at is null
      and account.archived_at is null
      and project.archived_at is null
  )
$$;

revoke execute on function private.is_client_account() from public, anon;
revoke execute on function private.is_client_of(uuid) from public, anon;
grant execute on function private.is_client_account() to authenticated;
grant execute on function private.is_client_of(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Signing up must not hand out an internal account
-- ---------------------------------------------------------------------------

-- Before this, every auth.users insert created an app_profiles row defaulting
-- to 'member'. That was survivable while the only way in was an owner creating
-- the account by hand. Enabling Google turns it into "anyone with a Google
-- account becomes an internal member", so the provider now decides the branch:
-- an external sign-in becomes a client with a pending invitation, or nothing
-- at all. Email/password provisioning is untouched.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.app_user_role;
  provider text;
  address text := lower(btrim(coalesce(new.email, '')));
  invited boolean;
begin
  provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  if provider <> 'email' then
    invited := exists (
      select 1 from public.app_project_client_invites invite
      where lower(invite.email) = address
        and invite.accepted_at is null
        and invite.revoked_at is null
        and invite.expires_at > now()
    );

    -- No invitation, no account of any kind. The auth.users row exists and
    -- reaches nothing, which is what a stranger signing in should get.
    if not invited then
      return new;
    end if;

    insert into public.app_client_users (id, email, full_name, avatar_url)
    values (
      new.id,
      address,
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(address, '@', 1)
      ),
      nullif(btrim(coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture'
      )), '')
    )
    on conflict (id) do nothing;

    return new;
  end if;

  requested_role := new.raw_app_meta_data ->> 'role';
  safe_role := case
    when requested_role in ('owner', 'member', 'finance') then requested_role::public.app_user_role
    else 'member'::public.app_user_role
  end;

  insert into public.app_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    safe_role
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accepting an invitation
-- ---------------------------------------------------------------------------

-- Called after Google returns. The address compared here is the one the
-- provider verified; there is no fuzzy match and no domain fallback.
create or replace function public.app_accept_client_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
  address text;
  accepted integer := 0;
  invite record;
begin
  if account_id is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  select lower(btrim(email)) into address
  from public.app_client_users
  where id = account_id and archived_at is null;

  if address is null then
    return 0;
  end if;

  for invite in
    select id, project_id
    from public.app_project_client_invites
    where lower(email) = address
      and accepted_at is null
      and revoked_at is null
      and expires_at > now()
  loop
    insert into public.app_project_client_access
      (project_id, client_user_id, granted_at)
    values (invite.project_id, account_id, now())
    on conflict (project_id, client_user_id) do update
      set revoked_at = null, revoked_by = null, granted_at = now();

    update public.app_project_client_invites
    set accepted_at = now()
    where id = invite.id;

    perform private.record_client_event(
      invite.project_id, 'client.access_accepted', '{}'::jsonb
    );

    accepted := accepted + 1;
  end loop;

  return accepted;
end;
$$;

revoke execute on function public.app_accept_client_invites() from public, anon;
grant execute on function public.app_accept_client_invites() to authenticated;

-- ---------------------------------------------------------------------------
-- What a client may read. This function is the allowlist.
-- ---------------------------------------------------------------------------

create or replace function public.app_client_projects()
returns table (public_id text, name text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select project.public_id, project.name, project.status::text
  from public.app_project_client_access access
  join public.app_projects project on project.id = access.project_id
  join public.app_client_users account on account.id = access.client_user_id
  where access.client_user_id = (select auth.uid())
    and access.revoked_at is null
    and account.archived_at is null
    and project.archived_at is null
  order by project.name
$$;

revoke execute on function public.app_client_projects() from public, anon;
grant execute on function public.app_client_projects() to authenticated;

-- Every field the portal can ever render is named here. Nothing is selected
-- and then filtered by the application: what is not built into this result
-- does not leave the database. Note what is absent — financials, credentials,
-- env groups, repository_url, profile ids, employment, other projects.
create or replace function public.app_client_portal(target_public_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  settings record;
  result jsonb;
begin
  select id into target_project_id
  from public.app_projects
  where public_id = target_public_id and archived_at is null;

  if target_project_id is null then
    return null;
  end if;

  -- The URL is never trusted. Membership of this exact project decides.
  if not (select private.is_client_of(target_project_id)) then
    return null;
  end if;

  select
    coalesce(s.share_ideaboard, false) as share_ideaboard,
    coalesce(s.share_staging, false) as share_staging,
    coalesce(s.share_design, false) as share_design,
    s.contact_name,
    s.contact_email
  into settings
  from (select 1) one
  left join public.app_project_client_settings s
    on s.project_id = target_project_id;

  select jsonb_build_object(
    'project', (
      select jsonb_build_object(
        'publicId', project.public_id,
        'name', project.name,
        'description', project.description,
        'status', project.status::text,
        'startsOn', project.starts_on,
        'dueOn', project.due_on,
        'updatedAt', project.updated_at
      )
      from public.app_projects project
      where project.id = target_project_id
    ),
    'weeks', coalesce((
      select jsonb_agg(week_row order by week_row ->> 'number')
      from (
        select jsonb_build_object(
          'id', week.id,
          'number', week.week_number,
          'startsOn', week.starts_on,
          'dueOn', week.due_on,
          'focus', week.focus,
          'completedAt', week.completed_at,
          'items', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', card.id,
                'title', card.title,
                'done', card.status = 'completed'
              )
              order by card.position, card.created_at
            )
            from public.app_milestone_cards card
            where card.milestone_week_id = week.id
              and card.board = 'work'
              and card.archived_at is null
          ), '[]'::jsonb)
        ) as week_row
        from public.app_milestone_weeks week
        where week.project_id = target_project_id
          and week.archived_at is null
      ) weeks
    ), '[]'::jsonb),
    'team', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', profile.full_name,
          'responsibility', member.responsibility,
          'avatarPath', profile.avatar_path,
          'isLead', project.lead_id = profile.id
        )
        order by (project.lead_id = profile.id) desc, profile.full_name
      )
      from public.app_project_members member
      join public.app_profiles profile on profile.id = member.profile_id
      join public.app_projects project on project.id = member.project_id
      where member.project_id = target_project_id
        and member.archived_at is null
        and profile.archived_at is null
        and profile.is_active
    ), '[]'::jsonb),
    'ideaboard', case
      when settings.share_ideaboard then (
        select board.doc
        from public.app_project_idea_boards board
        where board.project_id = target_project_id
      )
      else null
    end,
    'links', (
      select jsonb_build_object(
        'liveDomain', technical.live_domain,
        'stagingDomain', case when settings.share_staging then technical.staging_domain end,
        'designUrl', case when settings.share_design then technical.design_url end
      )
      from public.app_project_technical_details technical
      where technical.project_id = target_project_id
    ),
    'files', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', file.id,
          'name', file.file_name,
          'size', file.byte_size,
          'addedAt', file.created_at
        )
        order by file.created_at desc
      )
      from public.app_project_client_files file
      where file.project_id = target_project_id
        and file.client_visible
        and file.archived_at is null
    ), '[]'::jsonb),
    'contact', jsonb_build_object(
      'name', settings.contact_name,
      'email', settings.contact_email
    )
  )
  into result;

  return result;
end;
$$;

revoke execute on function public.app_client_portal(text) from public, anon;
grant execute on function public.app_client_portal(text) to authenticated;

-- A download re-asks the same question rather than trusting the file id.
create or replace function public.app_client_file_path(target_file_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  row_project uuid;
  row_path text;
begin
  select project_id, storage_path into row_project, row_path
  from public.app_project_client_files
  where id = target_file_id and client_visible and archived_at is null;

  if row_project is null then
    return null;
  end if;
  if not (select private.is_client_of(row_project)) then
    return null;
  end if;

  return row_path;
end;
$$;

revoke execute on function public.app_client_file_path(uuid) from public, anon;
grant execute on function public.app_client_file_path(uuid) to authenticated;

create or replace function public.app_client_seen(target_public_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  select id into target_project_id
  from public.app_projects
  where public_id = target_public_id and archived_at is null;

  if target_project_id is null then return; end if;
  if not (select private.is_client_of(target_project_id)) then return; end if;

  update public.app_project_client_access
  set last_seen_at = now()
  where project_id = target_project_id
    and client_user_id = (select auth.uid());

  perform private.record_client_event(
    target_project_id, 'client.portal_viewed', '{}'::jsonb
  );
end;
$$;

revoke execute on function public.app_client_seen(text) from public, anon;
grant execute on function public.app_client_seen(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies. Owners manage; clients read only their own identity row.
-- ---------------------------------------------------------------------------

alter table public.app_client_users enable row level security;
alter table public.app_project_client_invites enable row level security;
alter table public.app_project_client_access enable row level security;
alter table public.app_project_client_settings enable row level security;
alter table public.app_project_client_files enable row level security;

-- A client may read the row that says who they are, and nothing else anywhere.
create policy "client_users_self_or_owner" on public.app_client_users
  for select to authenticated
  using ((select private.is_owner()) or id = (select auth.uid()));

create policy "client_invites_owner" on public.app_project_client_invites
  for select to authenticated using ((select private.is_owner()));
create policy "client_invites_owner_insert" on public.app_project_client_invites
  for insert to authenticated with check ((select private.is_owner()));
create policy "client_invites_owner_update" on public.app_project_client_invites
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "client_access_owner" on public.app_project_client_access
  for select to authenticated using ((select private.is_owner()));
create policy "client_access_owner_update" on public.app_project_client_access
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "client_settings_owner" on public.app_project_client_settings
  for select to authenticated using ((select private.is_owner()));
create policy "client_settings_owner_insert" on public.app_project_client_settings
  for insert to authenticated with check ((select private.is_owner()));
create policy "client_settings_owner_update" on public.app_project_client_settings
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "client_files_owner" on public.app_project_client_files
  for select to authenticated using ((select private.is_owner()));
create policy "client_files_owner_insert" on public.app_project_client_files
  for insert to authenticated with check ((select private.is_owner()));
create policy "client_files_owner_update" on public.app_project_client_files
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

revoke all on
  public.app_client_users,
  public.app_project_client_invites,
  public.app_project_client_access,
  public.app_project_client_settings,
  public.app_project_client_files
from public, anon;

grant select on public.app_client_users to authenticated;
grant select, insert, update on public.app_project_client_invites to authenticated;
grant select, update on public.app_project_client_access to authenticated;
grant select, insert, update on public.app_project_client_settings to authenticated;
grant select, insert, update on public.app_project_client_files to authenticated;

-- Deliverables live in a private bucket. Clients never touch storage directly;
-- the application signs a URL only after app_client_file_path has re-checked
-- the link, so there is no bucket policy for them at all.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-client-files', 'app-client-files', false, 26214400)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

create policy "client_files_bucket_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'app-client-files' and (select private.is_owner()));
create policy "client_files_bucket_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'app-client-files' and (select private.is_owner()));
create policy "client_files_bucket_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'app-client-files' and (select private.is_owner()))
  with check (bucket_id = 'app-client-files' and (select private.is_owner()));
