begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('a0000000-0000-4000-8000-000000000001', 'delete-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Delete Owner"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'delete-second-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Second Owner"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'delete-clean@example.test',
   '{"role":"authenticated"}', '{"full_name":"Never Used"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'delete-worker@example.test',
   '{"role":"authenticated"}', '{"full_name":"Real Worker"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000005', 'delete-audited@example.test',
   '{"role":"authenticated"}', '{"full_name":"Opened A Secret"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000006', 'delete-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Delete Finance"}', now(), now());

update public.app_profiles set role = 'owner'
where id in (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

update public.app_profiles set role = 'finance'
where id = 'a0000000-0000-4000-8000-000000000006';

-- The clean person got as far as setting a password and no further. That writes
-- one member.activated row, which must not be what makes them permanent.
insert into public.app_audit_logs (actor_id, action, resource_type, resource_id)
values (
  'a0000000-0000-4000-8000-000000000003', 'member.activated', 'app_profiles',
  'a0000000-0000-4000-8000-000000000003'
);

insert into public.app_employment_private (profile_id, salary_amount, cnic)
values ('a0000000-0000-4000-8000-000000000003', 180000, '35202-9999999-9');

insert into public.app_documents
  (profile_id, document_type, file_name, storage_path, uploaded_by)
values (
  'a0000000-0000-4000-8000-000000000003', 'contract', 'never-used.pdf',
  'delete-test/never-used.pdf', 'a0000000-0000-4000-8000-000000000001'
);

-- The worker is on a project, so a foreign key holds them.
insert into public.app_clients (id, name)
values ('a1000000-0000-4000-8000-000000000001', 'Delete Test Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'Delete Test Project', 'building', 'a0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, added_by)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000001'
);

-- The audited person did something that is not an account-lifecycle event.
insert into public.app_audit_logs (actor_id, action, resource_type)
values (
  'a0000000-0000-4000-8000-000000000005', 'credential.opened', 'credential'
);

set local role authenticated;

-- Owner ---------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);

select is(
  public.app_team_member_deletable('a0000000-0000-4000-8000-000000000003'),
  null,
  'someone who only ever set a password can be deleted'
);

select is(
  public.app_team_member_deletable('a0000000-0000-4000-8000-000000000004'),
  'they are recorded on project work',
  'someone on a project is held, and the reason says so'
);

select is(
  public.app_team_member_deletable('a0000000-0000-4000-8000-000000000005'),
  'they have audit history',
  'a real audit entry holds them, unlike member.activated'
);

select is(
  public.app_team_member_deletable('a0000000-0000-4000-8000-000000000001'),
  'you cannot delete your own account',
  'an owner cannot delete themselves'
);

select is(
  public.app_team_member_deletable('a0000000-0000-4000-8000-000000000002'),
  null,
  'a second owner can be deleted while another owner remains'
);

select throws_ok(
  $$select public.app_delete_team_member('a0000000-0000-4000-8000-000000000004')$$,
  'P0001',
  null,
  'deleting someone with work raises the written refusal, not a foreign key error'
);

select is(
  (select count(*) from public.app_project_members
   where profile_id = 'a0000000-0000-4000-8000-000000000004')::int,
  1,
  'and nothing of theirs was removed on the way to that refusal'
);

-- Member --------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true
);

select throws_ok(
  $$select public.app_team_member_deletable('a0000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'a member cannot even ask whether someone is deletable'
);

select throws_ok(
  $$select public.app_delete_team_member('a0000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'a member cannot delete anyone'
);

-- Finance -------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000006', true
);

select throws_ok(
  $$select public.app_delete_team_member('a0000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'finance cannot delete anyone'
);

-- Owner deletes the clean account -------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);

select is(
  public.app_delete_team_member('a0000000-0000-4000-8000-000000000003'),
  array['delete-test/never-used.pdf'],
  'the delete hands back the file to clear out of storage'
);

select is(
  (select count(*) from public.app_profiles
   where id = 'a0000000-0000-4000-8000-000000000003')::int,
  0,
  'the profile is gone'
);

select is(
  (select count(*) from public.app_employment_private
   where profile_id = 'a0000000-0000-4000-8000-000000000003')::int,
  0,
  'their salary and CNIC are gone'
);

select is(
  (select count(*) from public.app_documents
   where profile_id = 'a0000000-0000-4000-8000-000000000003')::int,
  0,
  'their contract row is gone'
);

select is(
  (select count(*) from public.app_audit_logs
   where actor_id = 'a0000000-0000-4000-8000-000000000003')::int,
  0,
  'their one account-lifecycle audit row went with them'
);

-- Anonymous -----------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  $$select public.app_delete_team_member('a0000000-0000-4000-8000-000000000002')$$,
  '42501',
  null,
  'an anonymous caller has no privilege on the delete function'
);

reset role;

select * from finish();
rollback;
