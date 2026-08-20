begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('90000000-0000-4000-8000-000000000001', 'team-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Team Owner"}', now(), now()),
  ('90000000-0000-4000-8000-000000000002', 'team-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Team Member"}', now(), now()),
  ('90000000-0000-4000-8000-000000000003', 'team-colleague@example.test',
   '{"role":"authenticated"}', '{"full_name":"Team Colleague"}', now(), now()),
  ('90000000-0000-4000-8000-000000000004', 'team-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Team Finance"}', now(), now());

update public.app_profiles
set role = 'owner'
where id = '90000000-0000-4000-8000-000000000001';

update public.app_profiles
set role = 'finance'
where id = '90000000-0000-4000-8000-000000000004';

update public.app_profiles
set job_title = 'Delivery engineer'
where id = '90000000-0000-4000-8000-000000000002';

-- The two engineers share a project, so can_view_profile() lets them see each
-- other's name. That is the point of the split being tested below: they can see
-- one another and still reach nothing personal.
insert into public.app_clients (id, name)
values ('91000000-0000-4000-8000-000000000001', 'Team Test Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values (
  '92000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  'Team Test Project', 'building', '90000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, added_by)
values
  ('92000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000002',
   '90000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000003',
   '90000000-0000-4000-8000-000000000001');

insert into public.app_employment_private
  (profile_id, employment_type, start_date, salary_amount, cnic,
   bank_account_title, bank_account_number, bank_name)
values
  ('90000000-0000-4000-8000-000000000002', 'employee', current_date - 200,
   240000, '35202-1234567-1', 'Team Member', 'PK36SCBL0000001123456702', 'Meezan'),
  ('90000000-0000-4000-8000-000000000003', 'employee', current_date - 100,
   310000, '35202-7654321-9', 'Team Colleague', 'PK36SCBL0000001123456703', 'HBL'),
  ('90000000-0000-4000-8000-000000000004', 'contractor', current_date - 50,
   90000, '35202-1111111-3', 'Team Finance', 'PK36SCBL0000001123456704', 'UBL');

insert into public.app_documents
  (profile_id, document_type, file_name, storage_path, uploaded_by)
values
  ('90000000-0000-4000-8000-000000000002', 'contract', 'member-contract.pdf',
   'team-test/member-contract.pdf', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000003', 'contract', 'colleague-contract.pdf',
   'team-test/colleague-contract.pdf', '90000000-0000-4000-8000-000000000001');

-- A row can be created before any of it has been collected ------------------
select lives_ok(
  $$insert into public.app_employment_private (profile_id)
    values ('90000000-0000-4000-8000-000000000001')$$,
  'an employment row can be opened with nothing but the person'
);

select throws_ok(
  $$update public.app_employment_private set cnic = '3520212345671'
    where profile_id = '90000000-0000-4000-8000-000000000002'$$,
  '23514',
  null,
  'a CNIC without its dashes is rejected rather than stored twice over'
);

set local role authenticated;

-- Owner ---------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true
);

select is(
  (select count(*) from public.app_employment_private)::int,
  4,
  'an owner reads every employment record'
);

select is(
  (select cnic from public.app_employment_private
   where profile_id = '90000000-0000-4000-8000-000000000002'),
  '35202-1234567-1',
  'an owner reads a national ID'
);

select is(
  (select salary_amount from public.app_employment_private
   where profile_id = '90000000-0000-4000-8000-000000000003')::int,
  310000,
  'an owner reads a salary'
);

select is(
  (select count(*) from public.app_documents)::int,
  2,
  'an owner reads every contract'
);

select lives_ok(
  $$update public.app_profiles set job_title = 'Senior engineer'
    where id = '90000000-0000-4000-8000-000000000002'$$,
  'an owner edits a job title'
);

-- Member --------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_employment_private)::int,
  1,
  'a member reads exactly one employment record'
);

select is(
  (select profile_id from public.app_employment_private),
  '90000000-0000-4000-8000-000000000002'::uuid,
  'and it is their own'
);

select is(
  (select count(*) from public.app_employment_private
   where profile_id = '90000000-0000-4000-8000-000000000003')::int,
  0,
  'a member asking for a colleague by id gets nothing, not a denial to work around'
);

select is(
  (select count(*) from public.app_documents
   where profile_id = '90000000-0000-4000-8000-000000000003')::int,
  0,
  'a member cannot reach a colleague''s contract'
);

select ok(
  (select full_name from public.app_profiles
   where id = '90000000-0000-4000-8000-000000000003') is not null,
  'a member can still see a project colleague by name'
);

select is(
  (select count(*) from public.app_profiles
   where id = '90000000-0000-4000-8000-000000000004')::int,
  0,
  'a member sees nothing of someone they share no project with'
);

select lives_ok(
  $$update public.app_profiles set role = 'owner'
    where id = '90000000-0000-4000-8000-000000000002'$$,
  'a member promoting themselves is not an error, it simply matches no row'
);

select is(
  (select role from public.app_profiles
   where id = '90000000-0000-4000-8000-000000000002')::text,
  'member',
  'and their role is unchanged'
);

select lives_ok(
  $$select public.app_member_activated()$$,
  'a member records their own arrival'
);

select ok(
  (select activated_at from public.app_profiles
   where id = '90000000-0000-4000-8000-000000000002') is not null,
  'and the stamp lands on their row'
);

-- Finance -------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '90000000-0000-4000-8000-000000000004', true
);

select is(
  (select count(*) from public.app_employment_private)::int,
  0,
  'finance reads no employment record at all, including their own salary'
);

select is(
  (select count(*) from public.app_documents)::int,
  0,
  'finance reads no HR document'
);

-- What the public set-password page may ask ---------------------------------
reset role;

-- The colleague has a password and an outstanding reset link; finance has been
-- archived since the assertions above.
update public.app_profiles
set activated_at = now() - interval '1 day', password_link_pending = true
where id = '90000000-0000-4000-8000-000000000003';

update public.app_profiles
set archived_at = now(), is_active = false
where id = '90000000-0000-4000-8000-000000000004';

set local role anon;

select is(
  public.app_password_already_set('90000000-0000-4000-8000-000000000001'),
  false,
  'someone who never set a password can use their link'
);

select is(
  public.app_password_already_set('90000000-0000-4000-8000-000000000002'),
  true,
  'someone who set their password is refused their spent link'
);

select is(
  public.app_password_already_set('90000000-0000-4000-8000-000000000003'),
  false,
  'a link the owner just issued opens the form again, so resets still work'
);

select is(
  public.app_password_already_set('90000000-0000-4000-8000-000000000004'),
  true,
  'an archived person is refused before they type anything'
);

select is(
  public.app_password_already_set('99999999-0000-4000-8000-000000000009'),
  false,
  'an id matching nobody answers false, so the page cannot discover accounts'
);

-- Anonymous -----------------------------------------------------------------
select throws_ok(
  $$select * from public.app_employment_private$$,
  '42501',
  null,
  'an anonymous visitor has no privilege on employment records'
);

reset role;

select * from finish();
rollback;
