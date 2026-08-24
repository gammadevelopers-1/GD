-- A spent registration blocked an address forever.
--
-- app_client_registrations is a pre-registration allowlist: the address is
-- written there just before the auth user is created, because Auth writes
-- app_app_metadata too late for a signup trigger to read it. It is meant to be a
-- short-lived handshake token.
--
-- It was only ever cleared on the failure paths in app/(admin)/clients/actions.ts.
-- On success it stayed, and neither delete function removed it, so once an
-- address had been a client it could never become a team account — the check in
-- app/(admin)/team/actions.ts reads a pending registration as "already a client",
-- even after that client is gone.
--
-- A registration now means exactly one thing: an invite is in flight.

delete from public.app_client_registrations registration
where not exists (
  select 1 from public.app_client_users account
  where lower(account.email) = lower(registration.email)
);

create or replace function public.app_delete_client_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  blocker text;
  gone_email text;
begin
  blocker := public.app_client_account_deletable(target);

  if blocker is not null then
    raise exception
      'That client cannot be deleted permanently because %. Archive them instead.',
      blocker
      using errcode = 'P0001';
  end if;

  select account.email into gone_email
  from public.app_client_users account where account.id = target;

  delete from public.app_audit_logs entry
  where entry.client_actor_id = target;

  delete from public.app_project_client_access access
  where access.client_user_id = target;

  delete from public.app_client_users account
  where account.id = target;

  delete from public.app_client_registrations registration
  where lower(registration.email) = lower(gone_email);
end;
$$;

create or replace function public.app_force_delete_client_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gone_email text;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can delete a client account.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_client_users account where account.id = target
  ) then
    raise exception 'That account no longer exists.'
      using errcode = 'P0001';
  end if;

  select account.email into gone_email
  from public.app_client_users account where account.id = target;

  update public.app_milestone_cards card
  set client_updated_by = null
  where card.client_updated_by = target;

  update public.app_week_idea_boards board
  set client_updated_by = null
  where board.client_updated_by = target;

  delete from public.app_audit_logs entry
  where entry.client_actor_id = target;

  delete from public.app_project_client_access access
  where access.client_user_id = target;

  delete from public.app_client_users account
  where account.id = target;

  delete from public.app_client_registrations registration
  where lower(registration.email) = lower(gone_email);
end;
$$;

comment on function public.app_force_delete_client_account(uuid)
is 'Erases a portal account whatever their history. Their board authorship is cleared, the work they wrote stays on the project, and the address is released.';

revoke all on function public.app_delete_client_account(uuid) from public, anon;
revoke all on function public.app_force_delete_client_account(uuid) from public, anon;
grant execute on function public.app_delete_client_account(uuid) to authenticated;
grant execute on function public.app_force_delete_client_account(uuid) to authenticated;
