-- Three findings from a role-by-role audit of the Supabase surface.
--
-- 1. app_client_signin_record was granted to anon and trusted its `succeeded`
--    argument. The publishable key is in every page of the marketing bundle, so
--    anyone could POST to /rest/v1/rpc/app_client_signin_record with
--    succeeded => true for any address and delete that address's failed
--    attempts, resetting the lockout counter between guesses. The five-attempt
--    limiter on the client portal was therefore unenforceable, and the same
--    grant let anyone lock a named client out on demand. Both halves of the
--    limiter now belong to service_role and are called from the server action
--    with the secret key, which is the only caller that actually knows whether
--    a sign-in succeeded.
--
-- 2. handle_new_auth_user fell back to role 'member' whenever an auth user
--    arrived with no role in app_metadata. Supabase's own signup endpoint
--    creates exactly such a user, so a stranger could self-register and get an
--    internal app_profiles row. Every table policy still denied them any data,
--    but they held an account on the internal platform and appeared in the team
--    list. Only the admin API can set app_metadata, so its presence is the
--    signal that a person was provisioned deliberately; without it no internal
--    account is created at all.
--
-- 3. app_grant_env_group_access had no grant or revoke statement, so Postgres'
--    default EXECUTE to PUBLIC stood and anon could reach it. It refuses
--    non-owners itself, so nothing was ever granted through it, but it was the
--    only credential-adjacent function reachable before signing in. The two
--    invoice conversion helpers are pure arithmetic over their arguments and
--    touch no table; they are closed here for consistency, not exposure.

-- ---------------------------------------------------------------------------
-- 1. The client sign-in limiter is server-side only
-- ---------------------------------------------------------------------------

revoke all on function public.app_client_signin_gate(text, text)
  from public, anon, authenticated;
revoke all on function public.app_client_signin_record(text, text, boolean)
  from public, anon, authenticated;

grant execute on function public.app_client_signin_gate(text, text)
  to service_role;
grant execute on function public.app_client_signin_record(text, text, boolean)
  to service_role;

comment on function public.app_client_signin_record(text, text, boolean)
is 'Records one portal sign-in attempt. Service role only: the outcome is not something a caller may assert about itself, and a caller who could would be able to clear its own lockout.';

-- ---------------------------------------------------------------------------
-- 2. An internal account exists only when someone provisioned it
-- ---------------------------------------------------------------------------

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
  pending_name text;
  is_client boolean;
begin
  requested_role := new.raw_app_meta_data ->> 'role';
  provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  -- A registration older than a day is treated as abandoned, so a row left
  -- behind by a failed share cannot quietly turn a future internal account
  -- into a client months later.
  select registration.full_name into pending_name
  from public.app_client_registrations registration
  where registration.email = address
    and registration.created_at > now() - interval '1 day';

  is_client := found or requested_role = 'client';

  delete from public.app_client_registrations registration
  where registration.email = address;

  if is_client then
    insert into public.app_client_users (id, email, full_name)
    values (
      new.id,
      address,
      coalesce(
        nullif(btrim(coalesce(pending_name, '')), ''),
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

  -- app_metadata can only be written with the secret key, so a role recorded
  -- there is proof an owner or a script created this person on purpose. A
  -- public signup carries no role and gets no account: the platform is not
  -- something anyone can join by asking.
  if requested_role is null then
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

comment on function private.handle_new_auth_user()
is 'Routes a new auth user to app_client_users, to app_profiles, or to neither. An internal profile is created only when app_metadata carries a role, which only the secret key can write.';

-- ---------------------------------------------------------------------------
-- 3. Function grants match the convention the rest of the schema follows
-- ---------------------------------------------------------------------------

revoke all on function public.app_grant_env_group_access(uuid, uuid, text)
  from public, anon;
grant execute on function public.app_grant_env_group_access(uuid, uuid, text)
  to authenticated;

revoke all on function public.app_invoice_pkr(numeric, public.app_currency, numeric)
  from public, anon;
revoke all on function public.app_invoice_usd(numeric, public.app_currency, numeric)
  from public, anon;
grant execute on function public.app_invoice_pkr(numeric, public.app_currency, numeric)
  to authenticated;
grant execute on function public.app_invoice_usd(numeric, public.app_currency, numeric)
  to authenticated;
