-- A cover image, and two narrower writers for the two pictures.
--
-- app_update_my_profile was written when the display name and the picture were
-- saved by one form, so it takes both and sets display_name unconditionally.
-- The profile page no longer works that way: the picture is changed by clicking
-- the picture, and the cover by the button on the cover. Calling the old
-- function to save an avatar alone would blank the display name in the same
-- statement, so the two pictures get writers of their own.
--
-- Each one still names its column in the SQL and still checks that the storage
-- path sits under the caller's own prefix, which is the whole reason these are
-- definer functions rather than an RLS policy: row level security decides which
-- rows an update may touch, never which columns.

alter table public.app_profiles
  add column if not exists banner_path text;

comment on column public.app_profiles.banner_path
is 'Cover image for this person''s profile page, in the app-banners bucket under their own id. Null means the page draws its default gradient.';

create or replace function public.app_update_my_avatar(new_avatar_path text)
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

  if new_avatar_path is null then
    raise exception 'A picture is required.' using errcode = '22023';
  end if;

  if new_avatar_path not like account_id::text || '/%' then
    raise exception 'That file does not belong to this account.'
      using errcode = '42501';
  end if;

  update public.app_profiles
  set avatar_path = new_avatar_path
  where id = account_id
    and is_active = true
    and archived_at is null;
end;
$$;

-- Null clears the cover and the page falls back to its gradient. That is the
-- one place a null path means something other than "leave it alone", so it is
-- spelled out rather than coalesced.
create or replace function public.app_update_my_banner(new_banner_path text)
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

  if new_banner_path is not null
     and new_banner_path not like account_id::text || '/%' then
    raise exception 'That file does not belong to this account.'
      using errcode = '42501';
  end if;

  update public.app_profiles
  set banner_path = new_banner_path
  where id = account_id
    and is_active = true
    and archived_at is null;
end;
$$;

revoke all on function public.app_update_my_avatar(text) from public, anon;
revoke all on function public.app_update_my_banner(text) from public, anon;
grant execute on function public.app_update_my_avatar(text) to authenticated;
grant execute on function public.app_update_my_banner(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Where the covers live
-- ---------------------------------------------------------------------------

-- Private and read through a server-signed URL, the same as every other bucket
-- here. A cover is wider than a face so the ceiling is higher, but the shape of
-- the policies is identical: write under your own prefix, read as a colleague.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-banners', 'app-banners', false, 4194304)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "banners_own_insert" on storage.objects;
create policy "banners_own_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'app-banners'
    and (select private.has_active_account())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "banners_own_update" on storage.objects;
create policy "banners_own_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'app-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'app-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "banners_own_delete" on storage.objects;
create policy "banners_own_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'app-banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "banners_internal_select" on storage.objects;
create policy "banners_internal_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'app-banners'
    and (select private.has_active_account())
  );
