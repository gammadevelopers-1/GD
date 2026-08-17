begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('80000000-0000-4000-8000-000000000001', 'chunk7-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Chunk7 Owner"}', now(), now()),
  ('80000000-0000-4000-8000-000000000002', 'chunk7-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Assigned Engineer"}', now(), now()),
  ('80000000-0000-4000-8000-000000000003', 'chunk7-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Unassigned Engineer"}', now(), now()),
  ('80000000-0000-4000-8000-000000000004', 'chunk7-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Book Keeper"}', now(), now());

update public.app_profiles
set role = 'owner'
where id = '80000000-0000-4000-8000-000000000001';

update public.app_profiles
set role = 'finance'
where id = '80000000-0000-4000-8000-000000000004';

insert into public.app_clients (id, name)
values ('81000000-0000-4000-8000-000000000001', 'Technical Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values
  ('82000000-0000-4000-8000-000000000001',
   '81000000-0000-4000-8000-000000000001',
   'Technical Project', 'building', '80000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000002',
   '81000000-0000-4000-8000-000000000001',
   'Archived Project', 'building', '80000000-0000-4000-8000-000000000001');

update public.app_projects
set archived_at = now()
where id = '82000000-0000-4000-8000-000000000002';

insert into public.app_project_members
  (project_id, profile_id, responsibility, added_by)
values (
  '82000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000002',
  'Delivery engineer',
  '80000000-0000-4000-8000-000000000001'
);

set local role authenticated;

-- Owner --------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '80000000-0000-4000-8000-000000000001', true
);

select lives_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'https://github.com/gamma/site',
      'https://vercel.com/gamma/site',
      'gammadevelopers.ai',
      'staging.gammadevelopers.ai',
      'https://figma.com/file/abc',
      'Sara at Northstar, sara@northstar.test',
      'Next.js 16, Supabase, Tailwind.',
      'Ask an owner for repo access on day one.'
    )$$,
  'an owner can save technical details'
);

select is(
  (select repository_url from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  'https://github.com/gamma/site',
  'the repository URL is stored as given'
);

select is(
  (select live_domain from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  'gammadevelopers.ai',
  'a bare domain is accepted for the live domain'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000002', 'https://github.com/gamma/x'
    )$$,
  '42501',
  'This project is archived. Restore it before editing its technical details.',
  'an archived project is read-only'
);

-- Secrets belong in the vault, not in project notes ------------------------
select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'postgresql://admin:hunter2@db.example.com:5432/app'
    )$$,
  '23514',
  null,
  'a database connection string is rejected'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'https://github.com/gamma/site', null, null, null, null, null,
      'Service key eyJhbGciOiJIUzI1NiIs.eyJyb2xlIjoic2VydmljZV9yb2xl.abcdefghij'
    )$$,
  '23514',
  null,
  'a JSON web token in the stack notes is rejected'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'https://github.com/gamma/site', null, null, null, null, null, null,
      'Staging password = Sup3rSecret99'
    )$$,
  '23514',
  null,
  'a password written into the onboarding notes is rejected'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'https://github.com/gamma/site', null, null, null,
      'javascript:alert(1)'
    )$$,
  '22023',
  'The design file URL must be a full http or https address.',
  'only http and https addresses are stored as links'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001', 'not a url'
    )$$,
  '22023',
  'The repository URL must be a full http or https address.',
  'a malformed repository URL is rejected'
);

-- Assigned member ----------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an assigned member can read the technical details'
);

select lives_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001',
      'https://github.com/gamma/site',
      'https://vercel.com/gamma/site',
      'gammadevelopers.ai',
      'staging.gammadevelopers.ai',
      'https://figma.com/file/abc',
      'Sara at Northstar, sara@northstar.test',
      'Next.js 16, Supabase, Tailwind. Node 22 locally.',
      'Ask an owner for repo access on day one.'
    )$$,
  'an assigned member can update non-sensitive technical details'
);

select is(
  (select updated_by from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  '80000000-0000-4000-8000-000000000002'::uuid,
  'the member who saved is recorded'
);

select throws_ok(
  $$update public.app_project_technical_details
    set stack_notes = 'direct write'
    where project_id = '82000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'nobody can update the table directly — the RPC is the only write path'
);

-- Unassigned member --------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '80000000-0000-4000-8000-000000000003', true
);

select is(
  (select count(*) from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  0::bigint,
  'an unassigned member cannot read the technical details'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001', 'https://github.com/attacker/x'
    )$$,
  '42501',
  'You are not on this project.',
  'an unassigned member cannot write technical details'
);

-- Finance ------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', '80000000-0000-4000-8000-000000000004', true
);

select is(
  (select count(*) from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  0::bigint,
  'finance never enters the project workspace'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001', 'https://github.com/gamma/site'
    )$$,
  '42501',
  'You are not on this project.',
  'finance cannot write technical details'
);

-- Removing someone removes the technical details too -----------------------
reset role;

update public.app_project_members
set archived_at = now(), archived_by = '80000000-0000-4000-8000-000000000001'
where project_id = '82000000-0000-4000-8000-000000000001'
  and profile_id = '80000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub', '80000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_technical_details
   where project_id = '82000000-0000-4000-8000-000000000001'),
  0::bigint,
  'a removed member loses the technical details immediately'
);

select throws_ok(
  $$select public.app_save_technical_details(
      '82000000-0000-4000-8000-000000000001', 'https://github.com/gamma/site'
    )$$,
  '42501',
  'You are not on this project.',
  'a removed member cannot write through a direct request'
);

-- Anonymous ----------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  $$select * from public.app_project_technical_details$$,
  '42501',
  null,
  'anonymous visitors have no privilege on the technical details table'
);

reset role;

select * from finish();
rollback;
