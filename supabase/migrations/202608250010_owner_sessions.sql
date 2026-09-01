-- The owner can already see their own devices. They could not answer the
-- question an owner actually gets asked after someone leaves, loses a laptop or
-- shares a password: who is signed in right now, on what, from where — and end
-- it. That answer lives in auth.sessions, which no client can read, so it comes
-- out through definer functions the same way app_my_sessions does.
--
-- Three deliberate limits, carried over from 202608220020:
--   * the address is whatever GoTrue recorded when the session opened;
--   * last_seen_at moves on token refresh, roughly hourly, not per request;
--   * ending a session deletes its refresh tokens, so the browser holding it
--     stops working when its current access token expires rather than instantly.
--
-- The caller's own current session is never ended by these functions. Signing
-- yourself out of the browser you are administering from is a foot-gun, and
-- there is already a control for it on My sessions.

alter table public.app_notifications
  drop constraint if exists app_notifications_kind_known;

alter table public.app_notifications
  add constraint app_notifications_kind_known check (
    kind in (
      'env_access',
      'project_member',
      'project_lead',
      'week_planned',
      'task_assigned',
      'session_revoked'
    )
  );

-- Everyone who could be signed in, with the sessions they hold. Archived
-- accounts are normally hidden, but one that still holds a live session is
-- exactly what this screen exists to surface, so it stays visible until the
-- session is gone.
create or replace function public.app_all_sessions()
returns table (
  profile_id uuid,
  full_name text,
  display_name text,
  email text,
  role public.app_user_role,
  session_id uuid,
  created_at timestamptz,
  last_seen_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can read other people''s sessions'
      using errcode = '42501';
  end if;

  return query
  select
    profile.id,
    profile.full_name,
    profile.display_name,
    account.email::text,
    profile.role,
    session.id,
    session.created_at,
    greatest(
      session.refreshed_at at time zone 'utc',
      session.updated_at,
      session.created_at
    ),
    session.user_agent,
    host(session.ip),
    session.id is not distinct from
      nullif((select auth.jwt()) ->> 'session_id', '')::uuid
  from public.app_profiles profile
  join auth.users account on account.id = profile.id
  left join auth.sessions session on session.user_id = profile.id
  where profile.archived_at is null
     or session.id is not null
  order by
    (profile.id = (select auth.uid())) desc,
    profile.full_name,
    8 desc nulls last;
end;
$$;

comment on function public.app_all_sessions()
is 'Every account and the sessions it holds, for the owner only. One row per session; a row with a null session_id is an account with nothing signed in.';

-- One device. The person losing it is told, so a remote sign-out is never
-- silent — being logged out with no explanation reads as a break-in.
create or replace function public.app_revoke_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_session uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  subject uuid;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can end another person''s session'
      using errcode = '42501';
  end if;

  if target_session_id is not distinct from owner_session then
    raise exception 'Sign this browser out from My sessions'
      using errcode = '42501';
  end if;

  select user_id into subject
  from auth.sessions
  where id = target_session_id;

  if subject is null then
    return;
  end if;

  delete from auth.sessions where id = target_session_id;

  perform private.deliver_notification(
    array[subject],
    'session_revoked',
    'A device was signed out',
    (select private.actor_name()) || ' signed one of your devices out.',
    '/settings'
  );
end;
$$;

-- Everything that account holds, except the browser the owner is sitting in.
create or replace function public.app_revoke_user_sessions(target_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_session uuid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  ended integer;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can end another person''s sessions'
      using errcode = '42501';
  end if;

  with removed as (
    delete from auth.sessions
    where user_id = target_profile_id
      and id is distinct from owner_session
    returning 1
  )
  select count(*) into ended from removed;

  if ended > 0 then
    perform private.deliver_notification(
      array[target_profile_id],
      'session_revoked',
      'You were signed out everywhere',
      (select private.actor_name()) || ' signed you out of every device.',
      '/settings'
    );
  end if;

  return ended;
end;
$$;

revoke all on function public.app_all_sessions() from public, anon;
revoke all on function public.app_revoke_session(uuid) from public, anon;
revoke all on function public.app_revoke_user_sessions(uuid) from public, anon;
grant execute on function public.app_all_sessions() to authenticated;
grant execute on function public.app_revoke_session(uuid) to authenticated;
grant execute on function public.app_revoke_user_sessions(uuid) to authenticated;
