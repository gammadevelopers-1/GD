begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('c0000000-0000-4000-8000-000000000001', 'copies-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Copy Owner"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000002', 'copies-ana@example.test',
   '{"role":"authenticated"}', '{"full_name":"Ana Engineer"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000003', 'copies-bilal@example.test',
   '{"role":"authenticated"}', '{"full_name":"Bilal Engineer"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000004', 'copies-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Outside Engineer"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000005', 'copies-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Copy Finance"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'c0000000-0000-4000-8000-000000000001';
update public.app_profiles set role = 'finance'
where id = 'c0000000-0000-4000-8000-000000000005';

insert into public.app_clients (id, name)
values ('c1000000-0000-4000-8000-000000000001', 'Copy Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'Copy Project', 'building',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values
  ('c2000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000002', 'Lead',
   'c0000000-0000-4000-8000-000000000001'),
  ('c2000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000003', 'Engineer',
   'c0000000-0000-4000-8000-000000000001')
on conflict (project_id, profile_id) do nothing;

insert into public.app_env_groups (id, project_id, name, kind, created_by)
values (
  'c3000000-0000-4000-8000-00000000000f',
  'c2000000-0000-4000-8000-000000000001',
  'Backend', 'main', 'c0000000-0000-4000-8000-000000000001'
);

set local role authenticated;

-- Ana creates her own copy ----------------------------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$select public.app_create_personal_env_group(
      'c2000000-0000-4000-8000-000000000001', 'Ana local')$$,
  'a member can create their own copy'
);

select is(
  (select count(*)::int from public.app_env_groups
   where kind = 'personal' and owner_profile_id = 'c0000000-0000-4000-8000-000000000002'),
  1, 'the copy belongs to its creator'
);

select lives_ok(
  $$select public.app_save_personal_env_variable(
      'c4000000-0000-4000-8000-000000000001',
      (select id from public.app_env_groups
       where owner_profile_id = 'c0000000-0000-4000-8000-000000000002' limit 1),
      'DATABASE_URL', 'YW5h', 'bm9uY2U=', 'dGFn', 1, repeat('a', 64))$$,
  'a member can write into their own copy'
);

-- Bilal creates his own, with the same key -----------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$select public.app_create_personal_env_group(
      'c2000000-0000-4000-8000-000000000001', 'Bilal local')$$,
  'a second member can create their own copy'
);

select lives_ok(
  $$select public.app_save_personal_env_variable(
      'c4000000-0000-4000-8000-000000000002',
      (select id from public.app_env_groups
       where owner_profile_id = 'c0000000-0000-4000-8000-000000000003' limit 1),
      'DATABASE_URL', 'YmlsYWw=', 'bm9uY2U=', 'dGFn', 1, repeat('b', 64))$$,
  'the same key can differ between two copies'
);

-- The isolation that matters --------------------------------------------------
select is(
  (select count(*)::int from public.app_env_groups
   where owner_profile_id = 'c0000000-0000-4000-8000-000000000002'),
  0, 'a member cannot see another member''s copy'
);

select is(
  (select count(*)::int from public.app_project_credentials
   where id = 'c4000000-0000-4000-8000-000000000001'),
  0, 'a member cannot see a variable in another member''s copy'
);

select throws_ok(
  $$select public.app_save_personal_env_variable(
      'c4000000-0000-4000-8000-000000000003',
      (select id from public.app_env_groups
       where name = 'Ana local'),
      'STOLEN', 'eA==', 'bm9uY2U=', 'dGFn', 1, repeat('c', 64))$$,
  '42501', 'That copy is not yours.',
  'a member cannot write into another member''s copy'
);

select throws_ok(
  $$select public.app_archive_personal_env_variable(
      'c4000000-0000-4000-8000-000000000001')$$,
  '42501', 'That variable is not yours.',
  'a member cannot archive another member''s variable'
);

select is(
  (select count(*)::int from public.app_env_merge_preview(
     'c2000000-0000-4000-8000-000000000001')
   where profile_id <> 'c0000000-0000-4000-8000-000000000003'),
  0, 'a member sees no compare row belonging to anyone else, even as project lead'
);

select ok(
  (select count(*)::int from public.app_env_merge_preview(
     'c2000000-0000-4000-8000-000000000001')) > 0,
  'a member does see their own copies, so they can read their own fingerprint'
);

select is(
  (select count(*)::int from public.app_env_merge_preview(
     'c2000000-0000-4000-8000-000000000001')
   where copy_kind <> 'personal'),
  0, 'a member sees no main row in the compare preview'
);

select throws_ok(
  $$select public.app_env_main_target(
      'c3000000-0000-4000-8000-00000000000f',
      'c4000000-0000-4000-8000-000000000002',
      'c4000000-0000-4000-8000-00000000000a')$$,
  '42501', 'Only an owner can change the main copy.',
  'the project lead cannot write into main'
);

-- An outsider sees nothing ----------------------------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000004', true);

select is(
  (select count(*)::int from public.app_env_groups
   where project_id = 'c2000000-0000-4000-8000-000000000001'),
  0, 'someone off the project sees no container at all'
);

select is(
  (select count(*)::int from public.app_project_credentials
   where project_id = 'c2000000-0000-4000-8000-000000000001'),
  0, 'someone off the project sees no variable at all'
);

select throws_ok(
  $$select public.app_create_personal_env_group(
      'c2000000-0000-4000-8000-000000000001', 'Sneaky')$$,
  '42501', 'You are not on this project.',
  'someone off the project cannot create a copy on it'
);

-- Finance sees nothing --------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000005', true);

select is(
  (select count(*)::int from public.app_env_groups
   where project_id = 'c2000000-0000-4000-8000-000000000001'),
  0, 'finance sees no env container'
);

select is(
  (select count(*)::int from public.app_env_merge_preview(
     'c2000000-0000-4000-8000-000000000001')),
  0, 'finance gets no compare rows'
);

-- The owner sees everything ---------------------------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::int from public.app_env_groups
   where project_id = 'c2000000-0000-4000-8000-000000000001'),
  3, 'the owner sees main and both copies'
);

select is(
  (select count(*)::int from public.app_env_merge_preview(
     'c2000000-0000-4000-8000-000000000001')
   where variable_name = 'DATABASE_URL'),
  2, 'compare reports both copies of the contested key'
);

select is(
  (select count(distinct value_digest)::int
   from public.app_env_merge_preview('c2000000-0000-4000-8000-000000000001')
   where variable_name = 'DATABASE_URL'),
  2, 'the two copies carry different digests, so they disagree'
);

select lives_ok(
  $$select public.app_env_main_target(
      'c3000000-0000-4000-8000-00000000000f',
      'c4000000-0000-4000-8000-000000000001',
      'c4000000-0000-4000-8000-00000000000b')$$,
  'the owner can open a main row for a contested key'
);

select lives_ok(
  $$select public.app_env_adopt_value(
      'c4000000-0000-4000-8000-00000000000b',
      'c4000000-0000-4000-8000-000000000001',
      'cmVzZWFsZWQ=', 'bm9uY2U=', 'dGFn', 1, repeat('a', 64))$$,
  'the owner can adopt a value into main'
);

select is(
  (select source_profile_id from public.app_project_credentials
   where id = 'c4000000-0000-4000-8000-00000000000b'),
  'c0000000-0000-4000-8000-000000000002'::uuid,
  'main records whose copy the value came from'
);

select lives_ok(
  $$select public.app_env_adopt_value(
      'c4000000-0000-4000-8000-00000000000b',
      'c4000000-0000-4000-8000-000000000002',
      'cmVzZWFsZWQy', 'bm9uY2U=', 'dGFn', 1, repeat('b', 64))$$,
  'the owner can change that choice later'
);

select is(
  (select source_profile_id from public.app_project_credentials
   where id = 'c4000000-0000-4000-8000-00000000000b'),
  'c0000000-0000-4000-8000-000000000003'::uuid,
  'main now shows the other member as the source'
);

select * from finish();
rollback;
