-- A person's own corner of the platform.
--
-- Everything official about someone is the owner's to set: their legal name,
-- their role, their job title, their salary. What was missing is the small
-- amount that is theirs -- what they want to be called day to day, and a face
-- against their name -- plus a say in which emails reach them.
--
-- The interesting problem is letting them edit exactly that and nothing else.
-- Row level security decides which *rows* an update may touch, never which
-- *columns*, so a self-update policy on app_profiles would let a member set
-- role = 'owner' in the same statement that changes their nickname. There is no
-- policy that prevents this. So there is no policy: the two definer functions
-- below are the only way a non-owner writes to their own row, and each one names
-- its columns in the SQL rather than trusting the caller to send the right ones.

alter table public.app_profiles
  add column if not exists display_name text,
  add column if not exists notify_milestones boolean not null default true,
  add column if not exists notify_weekly_summary boolean not null default true;

alter table public.app_profiles
  add constraint app_profiles_display_name_length
    check (display_name is null or char_length(display_name) between 2 and 60);

comment on column public.app_profiles.display_name
is 'What this person prefers to be called internally. full_name stays the official record and only an owner may change it.';

-- ---------------------------------------------------------------------------
-- The two columns a person owns about themselves
-- ---------------------------------------------------------------------------

create or replace function public.app_update_my_profile(
  new_display_name text,
  new_avatar_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
  trimmed text := nullif(btrim(coalesce(new_display_name, '')), '');
begin
  if account_id is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  if trimmed is not null and char_length(trimmed) not between 2 and 60 then
    raise exception 'A display name is between 2 and 60 characters.'
      using errcode = '22023';
  end if;

  -- An avatar must live under the caller's own prefix, so one person cannot
  -- point their row at another person's file.
  if new_avatar_path is not null
     and new_avatar_path not like account_id::text || '/%' then
    raise exception 'That file does not belong to this account.'
      using errcode = '42501';
  end if;

  update public.app_profiles
  set display_name = trimmed,
      avatar_path = coalesce(new_avatar_path, avatar_path)
  where id = account_id
    and is_active = true
    and archived_at is null;
end;
$$;

create or replace function public.app_update_my_notifications(
  milestones boolean,
  weekly boolean
)
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

  update public.app_profiles
  set notify_milestones = coalesce(milestones, true),
      notify_weekly_summary = coalesce(weekly, true)
  where id = account_id
    and is_active = true
    and archived_at is null;
end;
$$;

revoke all on function public.app_update_my_profile(text, text) from public, anon;
revoke all on function public.app_update_my_notifications(boolean, boolean) from public, anon;
grant execute on function public.app_update_my_profile(text, text) to authenticated;
grant execute on function public.app_update_my_notifications(boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Where the faces live
-- ---------------------------------------------------------------------------

-- Private, like every other bucket here. An avatar is still a picture of a
-- person, and the portal already reads these through a server-signed URL rather
-- than a public path.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-avatars', 'app-avatars', false, 2097152)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'app-avatars'
    and (select private.has_active_account())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'app-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'app-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'app-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Colleagues see each other's faces. Clients reach them only through the
-- server-signed portal payload, which needs no policy of its own.
drop policy if exists "avatars_internal_select" on storage.objects;
create policy "avatars_internal_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'app-avatars'
    and (select private.has_active_account())
  );
