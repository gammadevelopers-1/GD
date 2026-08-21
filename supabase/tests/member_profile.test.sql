begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('e0000000-0000-4000-8000-000000000001', 'mp-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"MP Owner"}', now(), now()),
  ('e0000000-0000-4000-8000-000000000002', 'mp-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"MP Member"}', now(), now()),
  ('e0000000-0000-4000-8000-000000000003', 'mp-colleague@example.test',
   '{"role":"authenticated"}', '{"full_name":"MP Colleague"}', now(), now()),
  ('e0000000-0000-4000-8000-000000000004', 'mp-archived@example.test',
   '{"role":"authenticated"}', '{"full_name":"MP Archived"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'e0000000-0000-4000-8000-000000000001';

update public.app_profiles set archived_at = now(), is_active = false
where id = 'e0000000-0000-4000-8000-000000000004';

set local role authenticated;

-- A member editing themselves ----------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000002', true
);

select lives_ok(
  $$select public.app_update_my_profile('Hamz', 'e0000000-0000-4000-8000-000000000002/face.png')$$,
  'a member sets their own display name and avatar'
);

select is(
  (select display_name from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002'),
  'Hamz',
  'and it lands on their row'
);

select is(
  (select avatar_path from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002'),
  'e0000000-0000-4000-8000-000000000002/face.png',
  'along with the avatar path'
);

-- The columns the function does not name ------------------------------------
select is(
  (select role from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002')::text,
  'member',
  'their role is untouched by the call that renamed them'
);

select is(
  (select full_name from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002'),
  'MP Member',
  'and the official name is still the owner''s to set'
);

select is(
  (select is_active from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002'),
  true,
  'and they are still active'
);

-- Someone else's row and someone else's files -------------------------------
select is(
  (select display_name from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000003'),
  null,
  'a colleague is unaffected, because the function only ever writes auth.uid()'
);

select throws_ok(
  $$select public.app_update_my_profile('Sneaky', 'e0000000-0000-4000-8000-000000000003/face.png')$$,
  '42501',
  null,
  'and an avatar path under another account is refused'
);

select throws_ok(
  $$select public.app_update_my_profile('x', null)$$,
  '22023',
  null,
  'a one-character display name is refused'
);

-- Notifications --------------------------------------------------------------
select lives_ok(
  $$select public.app_update_my_notifications(false, true)$$,
  'a member sets their own email preferences'
);

select is(
  (select notify_milestones from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000002'),
  false,
  'and the preference sticks'
);

-- An archived person ---------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000004', true
);

select lives_ok(
  $$select public.app_update_my_profile('Ghost', null)$$,
  'an archived account calling it is not an error'
);

select is(
  (select display_name from public.app_profiles
   where id = 'e0000000-0000-4000-8000-000000000004'),
  null,
  'but nothing is written for them'
);

-- The switches reach the digest that sends the mail ------------------------
reset role;

select is(
  (select count(*)::int
   from jsonb_array_elements(
     (select public.app_notification_digest(3) -> 'owners')
   ) owner_row
   where owner_row ->> 'name' = 'MP Owner'),
  1,
  'an owner who wants the weekly summary is listed as a recipient'
);

update public.app_profiles set notify_weekly_summary = false
where id = 'e0000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::int
   from jsonb_array_elements(
     (select public.app_notification_digest(3) -> 'owners')
   ) owner_row
   where owner_row ->> 'name' = 'MP Owner'),
  0,
  'and turning it off takes them out of the list the mailer reads'
);

-- Anonymous ------------------------------------------------------------------
set local role anon;

select throws_ok(
  $$select public.app_update_my_profile('Anyone', null)$$,
  '42501',
  null,
  'an anonymous caller has no privilege on the function'
);

reset role;

select * from finish();
rollback;
