-- Client access moves from Google sign-in to email and password that we issue.
--
-- The access model underneath is unchanged and still the important part: a
-- client is not an app_profiles row, so private.current_app_role() returns null
-- for them and every existing policy denies them by construction. What changes
-- is only how the account comes into existence and how it authenticates.
--
-- No password is stored here. Supabase Auth holds the hash; these tables hold
-- when it was issued, when it expires, and whether the client has replaced it.

-- ---------------------------------------------------------------------------
-- Invitations are gone. An owner creates the account outright.
-- ---------------------------------------------------------------------------

drop function if exists public.app_accept_client_invites();
drop table if exists public.app_project_client_invites;

-- ---------------------------------------------------------------------------
-- Password lifecycle
-- ---------------------------------------------------------------------------

alter table public.app_client_users
  -- True from the moment an owner issues a temporary password, and false only
  -- once the client has chosen their own. The portal refuses to render
  -- anything while it is true.
  add column if not exists must_set_password boolean not null default true,
  add column if not exists password_set_at timestamptz,
  add column if not exists temp_password_expires_at timestamptz,
  -- Null until the first successful sign-in. This is the "pending" state an
  -- owner sees, and it is the difference between "I sent it" and "they got in".
  add column if not exists activated_at timestamptz,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists created_by uuid references public.app_profiles(id) on delete restrict;

comment on column public.app_client_users.must_set_password
is 'Set when a temporary password is issued. The portal renders nothing but the change-password screen until the client clears it.';

comment on column public.app_client_users.activated_at
is 'First successful sign-in. Null means the handover has not completed, however long ago the password was sent.';

-- ---------------------------------------------------------------------------
-- Creating the account
-- ---------------------------------------------------------------------------

-- The account is made through the Auth admin API with role 'client' in its app
-- metadata. That is what this trigger keys on: a client never gets an
-- app_profiles row, and an email signup with no role still becomes a member
-- exactly as before, so internal provisioning is untouched.
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
begin
  requested_role := new.raw_app_meta_data ->> 'role';
  provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  if requested_role = 'client' then
    insert into public.app_client_users (id, email, full_name)
    values (
      new.id,
      address,
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        split_part(address, '@', 1)
      )
    )
    on conflict (id) do nothing;
    return new;
  end if;

  -- Nothing but email/password provisions an internal account. If an OAuth
  -- provider is ever switched on, a stranger signing in lands here and gets no
  -- account of any kind rather than becoming a member.
  if provider <> 'email' then
    return new;
  end if;

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
-- Sign-in throttling
-- ---------------------------------------------------------------------------

-- Sign-in happens before there is a session, so the counters cannot live behind
-- an authenticated policy. They live here instead, reachable only through two
-- definer functions that record and judge but never read rows back out.
create table if not exists public.app_client_signin_attempts (
  id bigint generated always as identity primary key,
  email_key text not null,
  ip_key text not null,
  succeeded boolean not null,
  occurred_at timestamptz not null default now()
);

create index if not exists app_signin_email_idx
  on public.app_client_signin_attempts (email_key, occurred_at desc);
create index if not exists app_signin_ip_idx
  on public.app_client_signin_attempts (ip_key, occurred_at desc);

alter table public.app_client_signin_attempts enable row level security;

drop policy if exists "signin_attempts_owner_read" on public.app_client_signin_attempts;
create policy "signin_attempts_owner_read" on public.app_client_signin_attempts
  for select to authenticated using ((select private.is_owner()));

revoke all on public.app_client_signin_attempts from public, anon, authenticated;
grant select on public.app_client_signin_attempts to authenticated;

-- Returns the number of seconds the caller must wait, or 0 when allowed.
-- Counted per address and per client independently, so one noisy network
-- cannot lock out an unrelated client and vice versa.
create or replace function public.app_client_signin_gate(
  email_key text,
  ip_key text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
-- The parameters share their names with the columns they are compared against,
-- so they are copied into locals first. Aliasing the table is not enough: an
-- unqualified name still resolves to the column.
declare
  target_email text := lower(btrim(coalesce(email_key, '')));
  target_ip text := ip_key;
  window_start timestamptz := now() - interval '15 minutes';
  by_email integer;
  by_ip integer;
  newest timestamptz;
begin
  select count(*), max(attempt.occurred_at) into by_email, newest
  from public.app_client_signin_attempts attempt
  where attempt.email_key = target_email
    and attempt.succeeded = false
    and attempt.occurred_at > window_start;

  select count(*) into by_ip
  from public.app_client_signin_attempts attempt
  where attempt.ip_key = target_ip
    and attempt.succeeded = false
    and attempt.occurred_at > window_start;

  if greatest(coalesce(by_email, 0), coalesce(by_ip, 0)) >= 5 then
    return greatest(
      1,
      ceil(extract(epoch from (coalesce(newest, now()) + interval '15 minutes' - now())))::integer
    );
  end if;

  return 0;
end;
$$;

create or replace function public.app_client_signin_record(
  email_key text,
  ip_key text,
  succeeded boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
-- Same shadowing problem as the gate above: the parameters are copied into
-- locals so a comparison cannot silently mean the column.
declare
  address text := lower(btrim(coalesce(email_key, '')));
  from_ip text := ip_key;
  was_ok boolean := succeeded;
begin
  insert into public.app_client_signin_attempts
    (email_key, ip_key, succeeded)
  values (address, from_ip, was_ok);

  -- A success clears the slate for that address, so a client who mistypes
  -- twice and then gets in is not still part-way to a lockout.
  if was_ok then
    delete from public.app_client_signin_attempts attempt
    where attempt.email_key = address and attempt.succeeded = false;
  end if;

  delete from public.app_client_signin_attempts attempt
  where attempt.occurred_at < now() - interval '1 day';
end;
$$;

revoke all on function public.app_client_signin_gate(text, text) from public;
revoke all on function public.app_client_signin_record(text, text, boolean) from public;
grant execute on function public.app_client_signin_gate(text, text) to anon, authenticated;
grant execute on function public.app_client_signin_record(text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Session lifecycle
-- ---------------------------------------------------------------------------

-- Called once after a successful sign-in. Records the first one as activation,
-- which is what turns a pending account into a real one in the owner's list.
create or replace function public.app_client_signed_in()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then return; end if;

  update public.app_client_users
  set last_sign_in_at = now(),
      last_seen_at = now(),
      activated_at = coalesce(activated_at, now())
  where id = account_id and archived_at is null;

  if found then
    insert into public.app_audit_logs
      (actor_id, client_actor_id, action, resource_type, resource_id, metadata)
    values (null, account_id, 'client.signed_in', 'client_portal', null, '{}'::jsonb);
  end if;
end;
$$;

-- Every portal load calls this. It refreshes the activity stamp and reports
-- whether the session has been idle too long, which is the inactivity timeout
-- the platform's JWT settings cannot express on their own.
create or replace function public.app_client_touch()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
  previous timestamptz;
begin
  if account_id is null then return true; end if;

  select last_seen_at into previous
  from public.app_client_users
  where id = account_id and archived_at is null;

  if previous is not null and previous < now() - interval '12 hours' then
    return true;
  end if;

  update public.app_client_users
  set last_seen_at = now()
  where id = account_id and archived_at is null;

  return false;
end;
$$;

create or replace function public.app_client_password_set()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then return; end if;

  update public.app_client_users
  set must_set_password = false,
      password_set_at = now(),
      temp_password_expires_at = null
  where id = account_id and archived_at is null;

  if found then
    insert into public.app_audit_logs
      (actor_id, client_actor_id, action, resource_type, resource_id, metadata)
    values (null, account_id, 'client.password_set', 'client_portal', null, '{}'::jsonb);
  end if;
end;
$$;

revoke all on function public.app_client_signed_in() from public, anon;
revoke all on function public.app_client_touch() from public, anon;
revoke all on function public.app_client_password_set() from public, anon;
grant execute on function public.app_client_signed_in() to authenticated;
grant execute on function public.app_client_touch() to authenticated;
grant execute on function public.app_client_password_set() to authenticated;

-- ---------------------------------------------------------------------------
-- Owners manage the account rows the trigger creates
-- ---------------------------------------------------------------------------

drop policy if exists "client_users_owner_update" on public.app_client_users;
create policy "client_users_owner_update" on public.app_client_users
  for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()));

drop policy if exists "client_access_owner_insert" on public.app_project_client_access;
create policy "client_access_owner_insert" on public.app_project_client_access
  for insert to authenticated
  with check ((select private.is_owner()));

grant insert, update on public.app_client_users to authenticated;
grant insert on public.app_project_client_access to authenticated;

-- A temporary password that was never used stops working after its window,
-- whatever Auth still holds. Checked on every load alongside the link itself.
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
      and (
        account.must_set_password = false
        or account.temp_password_expires_at is null
        or account.temp_password_expires_at > now()
      )
  )
$$;
