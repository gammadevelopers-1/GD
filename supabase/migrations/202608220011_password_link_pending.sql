-- A link is dead unless the owner just issued it.
--
-- 202608220010 worked this out by comparing invited_at with activated_at. That
-- is fragile reasoning: it infers intent from two timestamps that are written
-- for other reasons, and it silently unlocks an already-spent link the moment a
-- newer one is sent to the same person, whichever link they actually open.
--
-- The state being modelled is simply "there is a password link outstanding", so
-- it becomes a column that says exactly that. Sending a link raises it, setting a
-- password lowers it, and the page locks whenever someone has a password and
-- nothing is outstanding.
--
-- Archived and deactivated people are folded into the same answer. Their link
-- must not open the form either, and setPassword already refuses them, so the
-- screen should say so before they type rather than after.

alter table public.app_profiles
  add column if not exists password_link_pending boolean not null default false;

comment on column public.app_profiles.password_link_pending
is 'True from the moment a set-password link is emailed until that link is used. The public set-password page opens only while this is true or the person has never set a password.';

-- Anyone already holding an unused link keeps it working across this change.
update public.app_profiles
set password_link_pending = true
where activated_at is null
  and invited_at is not null
  and archived_at is null
  and is_active = true;

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
      and (
        profile.archived_at is not null
        or profile.is_active = false
        or (
          profile.activated_at is not null
          and profile.password_link_pending = false
        )
      )
  )
$$;

comment on function public.app_password_already_set(uuid)
is 'True when the set-password page must refuse this link: the person is archived, or they have a password and no link is outstanding. An id that matches nobody answers false, so the public page cannot be used to discover accounts.';

-- ---------------------------------------------------------------------------
-- Raising and lowering the flag
-- ---------------------------------------------------------------------------

create or replace function public.app_member_activated()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then return; end if;

  update public.app_profiles
  set activated_at = coalesce(activated_at, now()),
      password_link_pending = false
  where id = account_id
    and archived_at is null
    and is_active = true;

  if found then
    insert into public.app_audit_logs
      (actor_id, action, resource_type, resource_id, metadata)
    values (
      account_id, 'member.activated', 'app_profiles', account_id, '{}'::jsonb
    );
  end if;
end;
$$;

revoke all on function public.app_member_activated() from public, anon;
grant execute on function public.app_member_activated() to authenticated;
