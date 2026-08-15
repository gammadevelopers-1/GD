begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('60000000-0000-4000-8000-000000000001', 'chunk3-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Chunk Three Owner"}', now(), now()),
  ('60000000-0000-4000-8000-000000000002', 'chunk3-lead@example.test',
   '{"role":"authenticated"}', '{"full_name":"First Lead"}', now(), now()),
  ('60000000-0000-4000-8000-000000000003', 'chunk3-second@example.test',
   '{"role":"authenticated"}', '{"full_name":"Second Lead"}', now(), now());

update public.app_profiles
set role = 'owner'
where id = '60000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('61000000-0000-4000-8000-000000000001', 'Lifecycle Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  '62000000-0000-4000-8000-000000000001',
  '61000000-0000-4000-8000-000000000001',
  'Lifecycle Project',
  'discovery',
  '60000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000001'
);

select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '62000000-0000-4000-8000-000000000001'
      and profile_id = '60000000-0000-4000-8000-000000000002'
      and archived_at is null
  ),
  1::bigint,
  'choosing a lead on create puts that person on the project team'
);

update public.app_projects
set lead_id = '60000000-0000-4000-8000-000000000003'
where id = '62000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '62000000-0000-4000-8000-000000000001'
      and profile_id = '60000000-0000-4000-8000-000000000003'
      and archived_at is null
  ),
  1::bigint,
  'changing the lead grants the new lead access'
);
select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '62000000-0000-4000-8000-000000000001'
      and profile_id = '60000000-0000-4000-8000-000000000002'
      and archived_at is null
  ),
  1::bigint,
  'the previous lead keeps their assignment until an owner removes it'
);

update public.app_project_members
set archived_at = now()
where project_id = '62000000-0000-4000-8000-000000000001'
  and profile_id = '60000000-0000-4000-8000-000000000002';

update public.app_projects
set lead_id = '60000000-0000-4000-8000-000000000002'
where id = '62000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '62000000-0000-4000-8000-000000000001'
      and profile_id = '60000000-0000-4000-8000-000000000002'
      and archived_at is null
  ),
  1::bigint,
  'reassigning a former lead restores their assignment without duplicating it'
);
select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '62000000-0000-4000-8000-000000000001'
  ),
  2::bigint,
  'restoring reuses the existing row instead of creating a second one'
);

select throws_ok(
  $$update public.app_projects
    set starts_on = current_date, due_on = current_date - 5
    where id = '62000000-0000-4000-8000-000000000001'$$,
  '23514',
  null,
  'the database refuses a due date before the start date'
);

update public.app_projects
set starts_on = current_date - 10, due_on = current_date + 10
where id = '62000000-0000-4000-8000-000000000001';

insert into public.app_project_financials
  (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
values (
  '62000000-0000-4000-8000-000000000001', 24000, 'USD', 279.40, current_date
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  1::bigint,
  'the lead can see the project they lead'
);

update public.app_projects
set name = 'Renamed by a member'
where id = '62000000-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.app_project_financials
      (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
    values ('62000000-0000-4000-8000-000000000001', 1, 'USD', 1, current_date)$$,
  '42501',
  null,
  'a member cannot record project money'
);
update public.app_project_financials
set value_amount = 1
where project_id = '62000000-0000-4000-8000-000000000001';

select throws_ok(
  $$select public.app_record_project_event(
      '62000000-0000-4000-8000-000000000001', 'project.archived', '{}'::jsonb
    )$$,
  '42501',
  'Only an owner can record a project event.',
  'a member cannot write to the audit log'
);
select is(
  (select count(*) from public.app_audit_logs),
  0::bigint,
  'a member cannot read the audit log'
);

reset role;

select is(
  (select name from public.app_projects where id = '62000000-0000-4000-8000-000000000001'),
  'Lifecycle Project',
  'a member update of a project row changes nothing'
);
select is(
  (
    select value_amount
    from public.app_project_financials
    where project_id = '62000000-0000-4000-8000-000000000001'
  ),
  24000::numeric,
  'a member update of a recorded project value changes nothing'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true
);

select lives_ok(
  $$update public.app_projects set status = 'building'
    where id = '62000000-0000-4000-8000-000000000001'$$,
  'an owner can move a project through the lifecycle'
);
select lives_ok(
  $$select public.app_record_project_event(
      '62000000-0000-4000-8000-000000000001',
      'project.status_changed',
      '{"status_to":"building"}'::jsonb
    )$$,
  'an owner can record a lifecycle event'
);
select is(
  (
    select actor_id
    from public.app_audit_logs
    where resource_id = '62000000-0000-4000-8000-000000000001'
    order by occurred_at desc
    limit 1
  ),
  '60000000-0000-4000-8000-000000000001'::uuid,
  'the audit entry records who made the change'
);
select throws_ok(
  $$select public.app_record_project_event(
      '62000000-0000-4000-8000-000000000001', '   ', '{}'::jsonb
    )$$,
  '22023',
  'A project event needs a short action name.',
  'an audit entry cannot be written without an action name'
);

update public.app_projects
set archived_at = now()
where id = '62000000-0000-4000-8000-000000000001';

select is(
  (select count(*) from public.app_project_portfolio(include_archived => true)),
  1::bigint,
  'an owner can still find an archived project'
);

select set_config(
  'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true
);
select is(
  (select count(*) from public.app_project_portfolio(include_archived => true)),
  0::bigint,
  'archiving removes the assigned member''s access immediately'
);
select is(
  (
    select count(*)
    from public.app_projects
    where id = '62000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'an archived project cannot be reached by its id either'
);

select set_config(
  'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true
);
update public.app_projects
set archived_at = null
where id = '62000000-0000-4000-8000-000000000001';

select set_config(
  'request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true
);
select is(
  (select count(*) from public.app_project_portfolio()),
  1::bigint,
  'restoring gives the assigned member their access back'
);

reset role;

select ok(
  not has_function_privilege(
    'anon',
    'public.app_record_project_event(uuid, text, jsonb)',
    'EXECUTE'
  ),
  'anonymous callers cannot write to the audit log'
);

select * from finish();
rollback;
