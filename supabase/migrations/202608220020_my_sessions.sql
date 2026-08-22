-- Making the Sessions panel tell the truth.
--
-- The panel used to draw one row that said "This browser" and was hard-coded to
-- do so. It could not answer the only question the panel exists to answer --
-- is anything else signed in as me -- so it was decoration on a security page,
-- which is the worst place to put decoration.
--
-- The real answer is already in the database. GoTrue keeps a row per session in
-- auth.sessions with the address and user agent it saw, when the session was
-- opened and when its token was last refreshed. None of that reaches a client:
-- the auth schema is not exposed through PostgREST and it should not be. So a
-- definer function reads it, scoped to the caller, and returns the six fields
-- the panel actually renders.
--
-- Two honest limits. The address is whatever GoTrue recorded at the time, so a
-- session opened before this platform was behind a proxy that forwards the
-- caller's address may show the proxy's. And last_seen_at moves when the access
-- token is refreshed, roughly hourly, not on every request -- it is "active
-- around then", not "active this second". The panel words it that way.

create or replace function public.app_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  last_seen_at timestamptz,
  expires_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    session.id,
    session.created_at,
    greatest(
      session.refreshed_at at time zone 'utc',
      session.updated_at,
      session.created_at
    ),
    session.not_after,
    session.user_agent,
    host(session.ip),
    session.id is not distinct from
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid
  from auth.sessions session
  where session.user_id = (select auth.uid())
  order by 3 desc nulls last;
$$;

comment on function public.app_my_sessions()
is 'Every live session for the calling account, straight from auth.sessions. last_seen_at tracks token refresh, not individual requests.';

-- Ending one session deletes its refresh tokens by cascade, so the browser
-- holding it cannot mint a new access token once the current one expires.
create or replace function public.app_revoke_my_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  delete from auth.sessions
  where id = target_session_id
    and user_id = account_id;
end;
$$;

revoke all on function public.app_my_sessions() from public, anon;
revoke all on function public.app_revoke_my_session(uuid) from public, anon;
grant execute on function public.app_my_sessions() to authenticated;
grant execute on function public.app_revoke_my_session(uuid) to authenticated;
