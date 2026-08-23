-- Two findings from a role-by-role audit of the Supabase surface.
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
-- 2. app_grant_env_group_access had no grant or revoke statement, so Postgres'
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
-- 2. Function grants match the convention the rest of the schema follows
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
