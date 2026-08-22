begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('90000000-0000-4000-8000-000000000001', 'dash-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Dash Owner"}', now(), now()),
  ('90000000-0000-4000-8000-000000000002', 'dash-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Dash Member"}', now(), now()),
  ('90000000-0000-4000-8000-000000000003', 'dash-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Dash Outsider"}', now(), now()),
  ('90000000-0000-4000-8000-000000000004', 'dash-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Dash Finance"}', now(), now());

update public.app_profiles set role = 'owner'
where id = '90000000-0000-4000-8000-000000000001';
update public.app_profiles set role = 'finance'
where id = '90000000-0000-4000-8000-000000000004';

insert into public.app_clients (id, name)
values ('91000000-0000-4000-8000-000000000001', 'Dashboard Client');

insert into public.app_projects (
  id, public_id, client_id, name, status, lead_id, starts_on, due_on, created_by
)
values
  ('92000000-0000-4000-8000-000000000001', 'dashProjectA01',
   '91000000-0000-4000-8000-000000000001', 'Assigned Project', 'building',
   '90000000-0000-4000-8000-000000000002', current_date - 14, current_date + 7,
   '90000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000002', 'dashProjectB02',
   '91000000-0000-4000-8000-000000000001', 'Owner Only Project', 'building',
   null, current_date - 14, current_date + 40,
   '90000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000003', 'dashProjectC03',
   '91000000-0000-4000-8000-000000000001', 'Paused Project', 'paused',
   null, current_date - 14, current_date + 3,
   '90000000-0000-4000-8000-000000000001');

insert into public.app_milestone_weeks (
  id, project_id, week_number, starts_on, due_on
)
values ('93000000-0000-4000-8000-000000000001',
        '92000000-0000-4000-8000-000000000001', 1,
        current_date - 14, current_date - 7);

insert into public.app_milestone_cards (
  id, milestone_week_id, board, status, title, position, created_by, completed_at
)
values
  ('94000000-0000-4000-8000-000000000001',
   '93000000-0000-4000-8000-000000000001', 'work', 'completed',
   'Finished work', 1, '90000000-0000-4000-8000-000000000001', now() - interval '2 days'),
  ('94000000-0000-4000-8000-000000000002',
   '93000000-0000-4000-8000-000000000001', 'work', 'in_progress',
   'Outstanding work', 2, '90000000-0000-4000-8000-000000000001', null);

insert into public.app_invoices (
  id, invoice_number, client_id, project_id, amount, currency,
  exchange_rate_to_pkr, issued_on, due_on, status, paid_at, created_by
)
values ('95000000-0000-4000-8000-000000000001', 'DASH-001',
        '91000000-0000-4000-8000-000000000001',
        '92000000-0000-4000-8000-000000000001',
        1000, 'USD', 280, current_date - 3, current_date + 20, 'paid',
        now(), '90000000-0000-4000-8000-000000000001');

set local role authenticated;

-- owner
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);

select is(
  jsonb_array_length(public.app_dashboard_summary() -> 'projects'),
  2,
  'owner sees both active projects and not the paused one'
);
select is(
  (public.app_dashboard_summary() ->> 'overdue_cards')::integer,
  1,
  'owner sees the one outstanding card in an overdue week'
);
select is(
  (public.app_dashboard_summary() ->> 'shipped_current')::integer,
  1,
  'owner sees the card completed in the last seven days'
);
select isnt(
  public.app_dashboard_summary() -> 'financials',
  'null'::jsonb,
  'owner gets the money block'
);
select is(
  ((public.app_dashboard_summary() -> 'financials') ->> 'revenue_pkr')::numeric,
  280000::numeric,
  'owner revenue converts USD to PKR at the stored rate'
);
select is(
  (
    select (project ->> 'progress')::integer
    from jsonb_array_elements(public.app_dashboard_summary() -> 'projects') project
    where project ->> 'public_id' = 'dashProjectA01'
  ),
  50,
  'progress counts one of two cards complete'
);

-- member
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);

select is(
  jsonb_array_length(public.app_dashboard_summary() -> 'projects'),
  1,
  'member sees only the project they are on'
);
select is(
  public.app_dashboard_summary() -> 'financials',
  'null'::jsonb,
  'member never receives the money block'
);
select is(
  (public.app_dashboard_summary() ->> 'overdue_cards')::integer,
  1,
  'member sees overdue work on their own project'
);

-- outsider
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000003', true);

select is(
  jsonb_array_length(public.app_dashboard_summary() -> 'projects'),
  0,
  'a member on no projects sees no projects'
);
select is(
  (public.app_dashboard_summary() ->> 'overdue_cards')::integer,
  0,
  'a member on no projects sees no overdue work'
);
select is(
  public.app_dashboard_summary() -> 'financials',
  'null'::jsonb,
  'a member on no projects never receives the money block'
);

-- finance
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000004', true);

select is(
  jsonb_array_length(public.app_dashboard_summary() -> 'projects'),
  0,
  'finance is kept out of the projects workspace'
);
select isnt(
  public.app_dashboard_summary() -> 'financials',
  'null'::jsonb,
  'finance still gets the money block'
);

reset role;

select ok(
  not has_function_privilege('anon', 'public.app_dashboard_summary()', 'EXECUTE'),
  'anonymous callers cannot execute the dashboard summary'
);
select ok(
  has_function_privilege('authenticated', 'public.app_dashboard_summary()', 'EXECUTE'),
  'signed-in accounts can execute the dashboard summary'
);

select * from finish();
rollback;
