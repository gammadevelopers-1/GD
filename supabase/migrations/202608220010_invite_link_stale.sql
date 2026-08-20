-- Knowing a link is spent, without breaking the ones that are not.
--
-- 202608220009 answered "has this person ever set a password", and the page used
-- that to warn them. Locking the form on the same answer would have broken the
-- owner's "Send a new password link" button: the recipient of a reset link has
-- by definition already set a password once, so the screen would refuse the one
-- thing it was sent to do.
--
-- invited_at is stamped every time a link goes out, so the two timestamps
-- together say which came last. A link is spent only when the person activated
-- and nothing has been sent to them since. Send a fresh one and invited_at moves
-- past activated_at, and the form opens again.

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
      and (
        profile.invited_at is null
        or profile.invited_at <= profile.activated_at
      )
      and profile.archived_at is null
      and profile.is_active = true
  )
$$;

comment on function public.app_password_already_set(uuid)
is 'True when this person set a password and no newer link has been issued since. Keyed on the profile id rather than an address so the public set-password page cannot be used to enumerate accounts.';
