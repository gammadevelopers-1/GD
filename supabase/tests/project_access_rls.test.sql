begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

insert into auth.users (
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    'chunk1-owner@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Chunk One Owner"}',
    now(),
    now()
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    'chunk1-assigned@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Assigned Member"}',
    now(),
    now()
  ),
  (
    '90000000-0000-4000-8000-000000000003',
    'chunk1-unassigned@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Unassigned Member"}',
    now(),
    now()
  ),
  (
    '90000000-0000-4000-8000-000000000004',
    'chunk1-finance@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Finance User"}',
    now(),
    now()
  ),
  (
    '90000000-0000-4000-8000-000000000005',
    'chunk1-inactive@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Inactive Member"}',
    now(),
    now()
  );

update public.app_profiles
set role = 'owner'
where id = '90000000-0000-4000-8000-000000000001';

update public.app_profiles
set role = 'finance'
where id = '90000000-0000-4000-8000-000000000004';

insert into public.app_employment_private (
  profile_id,
  employment_type,
  start_date,
  salary_amount,
  salary_currency
)
values
  ('90000000-0000-4000-8000-000000000001', 'employee', current_date, 600000, 'PKR'),
  ('90000000-0000-4000-8000-000000000002', 'employee', current_date, 200000, 'PKR'),
  ('90000000-0000-4000-8000-000000000003', 'employee', current_date, 180000, 'PKR'),
  ('90000000-0000-4000-8000-000000000004', 'contractor', current_date, 150000, 'PKR'),
  ('90000000-0000-4000-8000-000000000005', 'employee', current_date, 170000, 'PKR');

insert into public.app_documents (
  id,
  profile_id,
  document_type,
  file_name,
  storage_path,
  uploaded_by
)
values
  (
    '90500000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'contract',
    'assigned-member-contract.pdf',
    'chunk-1/assigned-member-contract.pdf',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '90500000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000004',
    'contract',
    'finance-contract.pdf',
    'chunk-1/finance-contract.pdf',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '90500000-0000-4000-8000-000000000003',
    '90000000-0000-4000-8000-000000000005',
    'contract',
    'inactive-member-contract.pdf',
    'chunk-1/inactive-member-contract.pdf',
    '90000000-0000-4000-8000-000000000001'
  );

insert into public.app_clients (id, name)
values
  ('91000000-0000-4000-8000-000000000001', 'Visible Client'),
  ('91000000-0000-4000-8000-000000000002', 'Other Client');

insert into public.app_projects (
  id,
  client_id,
  name,
  status,
  lead_id,
  created_by
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    'Assigned Project',
    'building',
    '90000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000002',
    'Owner Project',
    'review',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '92000000-0000-4000-8000-000000000003',
    '91000000-0000-4000-8000-000000000002',
    'Archived Project',
    'closed',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001'
  );

update public.app_projects
set archived_at = now()
where id = '92000000-0000-4000-8000-000000000003';

insert into public.app_project_financials (
  project_id,
  value_amount,
  value_currency,
  exchange_rate_to_pkr,
  booked_on
)
values
  ('92000000-0000-4000-8000-000000000001', 1000, 'USD', 280, current_date),
  ('92000000-0000-4000-8000-000000000002', 500000, 'PKR', 1, current_date);

insert into public.app_project_members (
  project_id,
  profile_id,
  responsibility,
  added_by
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'Assigned engineer',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '92000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000005',
    'Inactive engineer',
    '90000000-0000-4000-8000-000000000001'
  )
on conflict (project_id, profile_id) do update
  set responsibility = excluded.responsibility,
      archived_at = null;

-- Deactivated after the assignment exists: someone is switched off while they
-- are still on a project, which is the case that has to stay safe.
update public.app_profiles
set is_active = false
where id = '90000000-0000-4000-8000-000000000005';

insert into public.app_milestone_weeks (
  id,
  project_id,
  week_number,
  starts_on,
  due_on
)
values (
  '93000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  1,
  current_date,
  current_date + 7
);

insert into public.app_milestone_items (
  id,
  milestone_week_id,
  label,
  assigned_to
)
values (
  '94000000-0000-4000-8000-000000000001',
  '93000000-0000-4000-8000-000000000001',
  'Protected milestone item',
  '90000000-0000-4000-8000-000000000002'
);

insert into public.app_project_technical_details (
  project_id,
  repository_url,
  stack_notes
)
values (
  '92000000-0000-4000-8000-000000000001',
  'https://github.com/example/chunk-one',
  'Test-only technical details.'
);

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-4000-8000-000000000001',
  true
);

select ok(private.has_active_account(), 'owner account is active');
select is(
  (select count(*) from public.app_projects),
  3::bigint,
  'owner can read active and archived projects for recovery'
);
select is(
  (select count(*) from public.app_projects where archived_at is null),
  2::bigint,
  'active project queries can exclude archived history'
);
select is(
  (select count(*) from public.app_project_financials),
  2::bigint,
  'owner can read project financials'
);
select is(
  (select count(*) from public.app_employment_private),
  5::bigint,
  'owner can read employment records'
);
select is(
  (select count(*) from public.app_documents),
  3::bigint,
  'owner can read private document records'
);

select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-4000-8000-000000000002',
  true
);

select is(
  (select count(*) from public.app_projects),
  1::bigint,
  'assigned member can read only the assigned project'
);
select is(
  (select count(*) from public.app_project_financials),
  0::bigint,
  'assigned member cannot read project financials'
);
select is(
  (select count(*) from public.app_project_technical_details),
  1::bigint,
  'assigned member can read assigned-project technical details'
);
select is(
  (select count(*) from public.app_employment_private),
  1::bigint,
  'member can read only their own employment record'
);
select is(
  (select count(*) from public.app_documents),
  1::bigint,
  'member can read only their own private document record'
);
select lives_ok(
  $$select public.app_toggle_milestone_item(
    '94000000-0000-4000-8000-000000000001'
  )$$,
  'assigned member can change milestone completion through the RPC'
);

reset role;
select ok(
  (select is_done from public.app_milestone_items where id = '94000000-0000-4000-8000-000000000001'),
  'completion RPC updates only the completion state'
);
select is(
  (
    select completed_by
    from public.app_milestone_items
    where id = '94000000-0000-4000-8000-000000000001'
  ),
  '90000000-0000-4000-8000-000000000002'::uuid,
  'completion RPC records the authenticated actor'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-4000-8000-000000000003',
  true
);

select is(
  (select count(*) from public.app_projects),
  0::bigint,
  'unassigned member cannot read projects'
);
select throws_ok(
  $$select public.app_toggle_milestone_item(
    '94000000-0000-4000-8000-000000000001'
  )$$,
  '42501',
  'Project milestone is unavailable.',
  'unassigned member cannot change milestone completion'
);

select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-4000-8000-000000000004',
  true
);

select is(
  (select count(*) from public.app_projects),
  0::bigint,
  'finance cannot enter the operational project workspace'
);
select is(
  (select count(*) from public.app_project_financials),
  2::bigint,
  'finance can read financial records for the future finance module'
);
select is(
  (select count(*) from public.app_employment_private),
  0::bigint,
  'finance cannot read HR employment records'
);
select is(
  (select count(*) from public.app_documents),
  0::bigint,
  'finance cannot read HR document records'
);

select set_config(
  'request.jwt.claim.sub',
  '90000000-0000-4000-8000-000000000005',
  true
);

select ok(
  not private.has_active_account(),
  'deactivated account is inactive'
);
select is(
  (select count(*) from public.app_projects),
  0::bigint,
  'deactivated assigned member cannot read projects'
);
select is(
  (select count(*) from public.app_profiles),
  0::bigint,
  'deactivated account cannot read its profile'
);
select is(
  (select count(*) from public.app_employment_private),
  0::bigint,
  'deactivated account cannot read employment records'
);
select is(
  (select count(*) from public.app_documents),
  0::bigint,
  'deactivated account cannot read document records'
);
select throws_ok(
  $$select public.app_toggle_milestone_item(
    '94000000-0000-4000-8000-000000000001'
  )$$,
  '42501',
  'Project milestone is unavailable.',
  'deactivated assigned member cannot change milestone completion'
);

reset role;

select ok(
  not has_table_privilege('anon', 'public.app_projects', 'SELECT'),
  'anonymous users have no project table privilege'
);
select ok(
  not has_table_privilege(
    'anon',
    'public.app_project_financials',
    'SELECT'
  ),
  'anonymous users have no project-financial privilege'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.app_milestone_items',
    'UPDATE'
  ),
  'authenticated users cannot directly update milestone planning fields'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.app_toggle_milestone_item(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot execute the milestone completion function'
);

select * from finish();
rollback;
