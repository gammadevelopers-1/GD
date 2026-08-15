begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

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
    '80000000-0000-4000-8000-000000000001',
    'chunk2-owner@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Chunk Two Owner"}',
    now(),
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    'chunk2-assigned@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Assigned Engineer"}',
    now(),
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    'chunk2-unassigned@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Unassigned Engineer"}',
    now(),
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000004',
    'chunk2-finance@example.test',
    '{"role":"authenticated"}',
    '{"full_name":"Finance Reviewer"}',
    now(),
    now()
  );

update public.app_profiles
set role = 'owner'
where id = '80000000-0000-4000-8000-000000000001';

update public.app_profiles
set role = 'finance'
where id = '80000000-0000-4000-8000-000000000004';

insert into public.app_clients (id, name)
values
  ('81000000-0000-4000-8000-000000000001', 'Northstar Industries'),
  ('81000000-0000-4000-8000-000000000002', 'Cedar Analytics');

insert into public.app_projects (
  id,
  client_id,
  name,
  status,
  lead_id,
  starts_on,
  due_on,
  created_by
)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001',
    'Northstar Operations Platform',
    'building',
    '80000000-0000-4000-8000-000000000002',
    current_date - 14,
    current_date + 30,
    '80000000-0000-4000-8000-000000000001'
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000002',
    'Cedar Analytics Launch',
    'review',
    '80000000-0000-4000-8000-000000000001',
    current_date - 40,
    current_date + 60,
    '80000000-0000-4000-8000-000000000001'
  ),
  (
    '82000000-0000-4000-8000-000000000003',
    '81000000-0000-4000-8000-000000000001',
    'Northstar Archived Rebuild',
    'closed',
    '80000000-0000-4000-8000-000000000001',
    current_date - 400,
    current_date - 200,
    '80000000-0000-4000-8000-000000000001'
  );

update public.app_projects
set archived_at = now()
where id = '82000000-0000-4000-8000-000000000003';

insert into public.app_project_financials (
  project_id,
  value_amount,
  value_currency,
  exchange_rate_to_pkr,
  booked_on
)
values (
  '82000000-0000-4000-8000-000000000001',
  12000,
  'USD',
  280,
  current_date
);

insert into public.app_project_members (
  project_id,
  profile_id,
  responsibility,
  added_by
)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000002',
    'Delivery engineer',
    '80000000-0000-4000-8000-000000000001'
  ),
  (
    '82000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000002',
    'Delivery engineer',
    '80000000-0000-4000-8000-000000000001'
  )
on conflict (project_id, profile_id) do update
  set responsibility = excluded.responsibility,
      archived_at = null;

insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
values
  (
    '83000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001',
    1,
    current_date - 13,
    current_date - 7
  ),
  (
    '83000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000001',
    2,
    current_date - 6,
    current_date + 1
  );

insert into public.app_milestone_items (
  id,
  milestone_week_id,
  label,
  is_done,
  completed_at,
  completed_by
)
values
  (
    '84000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000001',
    'Past week finished item',
    true,
    now(),
    '80000000-0000-4000-8000-000000000001'
  ),
  (
    '84000000-0000-4000-8000-000000000002',
    '83000000-0000-4000-8000-000000000001',
    'Past week unfinished item',
    false,
    null,
    null
  ),
  (
    '84000000-0000-4000-8000-000000000003',
    '83000000-0000-4000-8000-000000000002',
    'Current week finished item',
    true,
    now(),
    '80000000-0000-4000-8000-000000000001'
  ),
  (
    '84000000-0000-4000-8000-000000000004',
    '83000000-0000-4000-8000-000000000002',
    'Current week open item',
    false,
    null,
    null
  ),
  (
    '84000000-0000-4000-8000-000000000005',
    '83000000-0000-4000-8000-000000000002',
    'Current week second open item',
    false,
    null,
    null
  );

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000001',
  true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  2::bigint,
  'owner sees every active project in the portfolio'
);
select is(
  (select count(*) from public.app_project_portfolio(include_archived => true)),
  3::bigint,
  'owner can include archived projects for recovery'
);
select is(
  (
    select row.total_items
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  5,
  'milestone item totals are aggregated in the database'
);
select is(
  (
    select row.done_items
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  2,
  'completed milestone items are counted'
);
select is(
  (
    select row.overdue_items
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  1,
  'overdue work is derived from unfinished items in past weeks'
);
select is(
  (
    select row.current_week_number
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  2,
  'the current week is the week containing today'
);
select is(
  (
    select row.current_week_total
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  3,
  'the current week reports its own item count'
);
select is(
  (
    select row.current_week_done
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  1,
  'the current week reports its own completed count'
);
select is(
  (
    select row.member_count
    from public.app_project_portfolio() row
    where row.id = '82000000-0000-4000-8000-000000000001'
  ),
  1,
  'only active assignments are counted as team size'
);
select is(
  (
    select count(*)
    from public.app_project_portfolio(
      filter_statuses => array['review']::public.app_project_status[]
    )
  ),
  1::bigint,
  'status filter narrows the portfolio'
);
select is(
  (
    select count(*)
    from public.app_project_portfolio(
      filter_client_id => '81000000-0000-4000-8000-000000000001'
    )
  ),
  1::bigint,
  'client filter narrows the portfolio'
);
select is(
  (
    select count(*)
    from public.app_project_portfolio(
      filter_person_id => '80000000-0000-4000-8000-000000000002'
    )
  ),
  1::bigint,
  'person filter returns the projects that person works on'
);
select is(
  (select count(*) from public.app_project_portfolio(search_text => 'northstar')),
  1::bigint,
  'search matches a project name regardless of case'
);
select is(
  (select count(*) from public.app_project_portfolio(search_text => 'cedar')),
  1::bigint,
  'search also matches the client name'
);
select is(
  (select count(*) from public.app_project_portfolio(search_text => '%')),
  0::bigint,
  'search treats wildcard characters as literal text'
);
select is(
  (select count(*) from public.app_portfolio_clients()),
  2::bigint,
  'owner filter options list every client with a project'
);
select is(
  (select count(*) from public.app_portfolio_people()),
  2::bigint,
  'owner filter options list every lead and assignee'
);
select is(
  (select row.name from public.app_project_portfolio() row limit 1),
  'Northstar Operations Platform',
  'active delivery is ordered by the nearest due date'
);

select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000002',
  true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  1::bigint,
  'assigned member sees only assigned projects'
);
select is(
  (select count(*) from public.app_project_portfolio(include_archived => true)),
  1::bigint,
  'a member cannot reach an archived project by asking for archived rows'
);
select is(
  (select row.id from public.app_project_portfolio() row),
  '82000000-0000-4000-8000-000000000001'::uuid,
  'the member portfolio contains the assigned project'
);
select is(
  (select count(*) from public.app_portfolio_clients()),
  1::bigint,
  'member client options are limited to their own projects'
);
select is(
  (select count(*) from public.app_portfolio_people()),
  1::bigint,
  'member person options are limited to colleagues on their own projects'
);
select is(
  (select count(*) from public.app_project_financials),
  0::bigint,
  'member still cannot read project value while using the portfolio'
);

select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000003',
  true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  0::bigint,
  'unassigned member receives no portfolio rows'
);
select is(
  (select count(*) from public.app_portfolio_clients()),
  0::bigint,
  'unassigned member receives no client options'
);
select is(
  (select count(*) from public.app_portfolio_people()),
  0::bigint,
  'unassigned member receives no person options'
);

select set_config(
  'request.jwt.claim.sub',
  '80000000-0000-4000-8000-000000000004',
  true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  0::bigint,
  'finance has no operational project workspace'
);
select is(
  (select count(*) from public.app_portfolio_clients()),
  0::bigint,
  'finance receives no portfolio filter options'
);

reset role;

select ok(
  pg_get_function_result('public.app_project_portfolio'::regproc) !~* 'value',
  'the portfolio result has no project-value column at all'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.app_project_portfolio(text, public.app_project_status[], uuid, uuid, boolean)',
    'EXECUTE'
  ),
  'anonymous callers cannot execute the portfolio function'
);
select ok(
  not has_function_privilege('anon', 'public.app_portfolio_clients()', 'EXECUTE'),
  'anonymous callers cannot execute the client options function'
);
select ok(
  not has_function_privilege('anon', 'public.app_portfolio_people()', 'EXECUTE'),
  'anonymous callers cannot execute the person options function'
);

select * from finish();
rollback;
