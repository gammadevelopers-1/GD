-- Telling someone their password is already set, before they type one.
--
-- A recovery token is single use and cannot be inspected without spending it,
-- so the set-password page had no way to know the link was stale until the
-- person had filled the form in and pressed the button. That is the wrong order
-- to learn it in.
--
-- The obvious fix -- look the address up -- is the one to avoid. That page is
-- public and unauthenticated, so a function taking an email would let anyone
-- test which addresses are Gamma accounts. This takes the profile id instead,
-- which is a random uuid that only the invitation link carries. Someone holding
-- the link already has far more than this one bit about the account, and
-- someone without it has nothing to guess.

create or replace function public.app_password_already_set(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_profiles profile
    where profile.id = target
      and profile.activated_at is not null
      and profile.archived_at is null
      and profile.is_active = true
  )
$$;

comment on function public.app_password_already_set(uuid)
is 'Whether this person has ever set their own password. Keyed on the profile id rather than an address so the public set-password page cannot be used to enumerate accounts.';

revoke all on function public.app_password_already_set(uuid) from public;
grant execute on function public.app_password_already_set(uuid) to anon, authenticated;
