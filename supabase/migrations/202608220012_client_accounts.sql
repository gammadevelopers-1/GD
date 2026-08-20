-- Clients get an invitation instead of a handed-over password.
--
-- 202608220002 removed the temporary-password dance on purpose: an owner
-- generated a password, read it off the screen, and passed it on. That was the
-- right call while there was no way to email anyone. There is now -- the team
-- invitation flow built on generatePasswordToken and Resend -- so the same
-- hand-off works for a client, and the owner stops being a courier for
-- credentials.
--
-- What does not move is the access model, which is the part worth protecting. A
-- client is still not an app_profiles row, so private.current_app_role() is null
-- for them and every policy written in terms of is_owner / is_finance /
-- is_project_member denies them by construction. They still hold no select
-- policy on any project table and still read everything through
-- private.client_portal_payload. Only how the password is delivered changes.
--
-- One shift in meaning to record: activated_at used to mean "first successful
-- sign-in". It now means "chose their own password", stamped by
-- app_client_password_set below and left alone by app_client_signed_in, which
-- already coalesces. For an account created under the old model the first
-- sign-in still fills it, so no row is left without an answer.

alter table public.app_client_users
  add column if not exists invited_at timestamptz,
  add column if not exists password_link_pending boolean not null default false;

comment on column public.app_client_users.invited_at
is 'When the set-password invitation was last emailed. Null means the account exists but nothing has been sent.';

comment on column public.app_client_users.password_link_pending
is 'True from the moment a set-password link is issued until it is used. The public page opens only while this is true or the client has never set a password.';

-- ---------------------------------------------------------------------------
-- Setting the password
-- ---------------------------------------------------------------------------

-- Dropped by 202608220002 when the flow it belonged to was removed. Recreating
-- it is deliberate, and it writes client_actor_id rather than actor_id because a
-- client has no app_profiles row for actor_id to reference.
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
  set activated_at = coalesce(activated_at, now()),
      password_link_pending = false,
      password_issued_at = now()
  where id = account_id
    and archived_at is null;

  if found then
    insert into public.app_audit_logs
      (actor_id, client_actor_id, action, resource_type, resource_id, metadata)
    values (
      null, account_id, 'client.password_set', 'client_portal', null,
      '{}'::jsonb
    );
  end if;
end;
$$;

-- The client twin of app_password_already_set. Keyed on the account id, which
-- only the invitation link carries, so the public page cannot be pointed at an
-- address to find out whether it belongs to a Gamma client.
create or replace function public.app_client_link_state(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_client_users account
    where account.id = target
      and (
        account.archived_at is not null
        or (
          account.activated_at is not null
          and account.password_link_pending = false
        )
      )
  )
$$;

comment on function public.app_client_link_state(uuid)
is 'True when the set-password page must refuse this link: the client is archived, or they have a password and no link is outstanding. An id matching nobody answers false.';

revoke all on function public.app_client_password_set() from public, anon;
revoke all on function public.app_client_link_state(uuid) from public;
grant execute on function public.app_client_password_set() to authenticated;
grant execute on function public.app_client_link_state(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Deleting a portal account
-- ---------------------------------------------------------------------------

-- Four foreign keys reference app_client_users and every one is ON DELETE
-- RESTRICT, so the same approach as app_delete_team_member applies: ask the
-- question in plain language first and leave the constraints as the backstop.
--
-- The audit exception is narrower here than it is for a team member. Signing in,
-- viewing the portal, accepting access and setting a password are things that
-- happen to an account rather than work done through it, and they go when it
-- goes. Ticking a milestone or writing in an idea board is the client's own
-- contribution to a project, and it holds the account permanently.
create or replace function private.client_account_history_reason(target uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.app_milestone_cards card
      where card.client_updated_by = target
    ) or exists (
      select 1 from public.app_week_idea_boards board
      where board.client_updated_by = target
    ) then 'they have written on a project board'

    when exists (
      select 1 from public.app_audit_logs entry
      where entry.client_actor_id = target
        and entry.action not in (
          'client.signed_in',
          'client.password_set',
          'client.portal_viewed',
          'client.access_accepted'
        )
    ) then 'they have activity recorded on a project'

    else null
  end
$$;

create or replace function public.app_client_account_deletable(target uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can delete a client account.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_client_users account where account.id = target
  ) then
    return 'that account no longer exists';
  end if;

  return (select private.client_account_history_reason(target));
end;
$$;

create or replace function public.app_delete_client_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  blocker text;
begin
  blocker := public.app_client_account_deletable(target);

  if blocker is not null then
    raise exception
      'That client cannot be deleted permanently because %. Archive them instead.',
      blocker
      using errcode = 'P0001';
  end if;

  delete from public.app_audit_logs entry
  where entry.client_actor_id = target;

  delete from public.app_project_client_access access
  where access.client_user_id = target;

  delete from public.app_client_users account
  where account.id = target;
end;
$$;

revoke all on function private.client_account_history_reason(uuid) from public, anon, authenticated;
revoke all on function public.app_client_account_deletable(uuid) from public, anon;
revoke all on function public.app_delete_client_account(uuid) from public, anon;
grant execute on function public.app_client_account_deletable(uuid) to authenticated;
grant execute on function public.app_delete_client_account(uuid) to authenticated;
