begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('d0000000-0000-4000-8000-000000000001', 'links-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Link Owner"}', now(), now()),
  ('d0000000-0000-4000-8000-000000000002', 'links-lead@example.test',
   '{"role":"authenticated"}', '{"full_name":"Link Lead"}', now(), now()),
  ('d0000000-0000-4000-8000-000000000003', 'links-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Link Member"}', now(), now()),
  ('d0000000-0000-4000-8000-000000000004', 'links-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Link Outsider"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'd0000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('d1000000-0000-4000-8000-000000000001', 'Link Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  'd2000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'Link Project', 'building',
  'd0000000-0000-4000-8000-000000000002',
  'd0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values
  ('d2000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000002', 'Lead',
   'd0000000-0000-4000-8000-000000000001'),
  ('d2000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000003', 'Engineer',
   'd0000000-0000-4000-8000-000000000001')
on conflict (project_id, profile_id) do nothing;

-- The insert trigger seeds the seven predefined rows -------------------------
select is(
  (select count(*)::int from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001'),
  7,
  'a new project is seeded with the seven predefined links'
);

select is(
  (select count(*)::int from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001'
     and kind = 'notes'),
  2,
  'two of the seeded rows are notes'
);

set local role authenticated;

-- Owner ---------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.app_set_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository'),
       'https://github.com/gamma/link-project') $$,
  'an owner sets a predefined link'
);

select is(
  (select value from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository'),
  'https://github.com/gamma/link-project',
  'the value is stored'
);

select lives_ok(
  $$ select public.app_rename_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository'),
       'Monorepo') $$,
  'an owner renames a predefined label'
);

select is(
  (select label from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository'),
  'Monorepo',
  'the new label is stored'
);

select throws_ok(
  $$ select public.app_set_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'live'),
       'not a web address at all') $$,
  '23514',
  null,
  'a link value that is not a web address is refused'
);

select throws_ok(
  $$ select public.app_set_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'stack'),
       'DATABASE_URL=postgres://acme:hunter2@db.acme.io/app') $$,
  '23514',
  null,
  'a secret pasted into notes is refused'
);

select lives_ok(
  $$ select public.app_add_project_link(
       'd2000000-0000-4000-8000-000000000001',
       'Status page', 'https://status.acme.app') $$,
  'an owner adds a custom link'
);

select is(
  (select count(*)::int from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001' and slug is null),
  1,
  'the custom link is stored without a slug'
);

select throws_ok(
  $$ select public.app_delete_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository')) $$,
  'P0001',
  null,
  'a predefined row cannot be deleted outright'
);

select lives_ok(
  $$ select public.app_clear_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository')) $$,
  'a predefined row can be cleared'
);

select is(
  (select value from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'repository'),
  '',
  'clearing empties the value but keeps the row'
);

-- Lead has the same reach ----------------------------------------------------
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$ select public.app_set_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'live'),
       'acme.app') $$,
  'the project lead may set a link'
);

-- A plain member may read but not write --------------------------------------
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000003', true);

select is(
  (select count(*)::int from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001'),
  8,
  'a project member can read every link'
);

select throws_ok(
  $$ select public.app_set_project_link(
       (select id from public.app_project_links
        where project_id = 'd2000000-0000-4000-8000-000000000001' and slug = 'design'),
       'https://figma.com/file/acme') $$,
  '42501',
  null,
  'a plain project member cannot change a link'
);

select throws_ok(
  $$ select public.app_add_project_link(
       'd2000000-0000-4000-8000-000000000001', 'Sneaky', 'https://example.com') $$,
  '42501',
  null,
  'a plain project member cannot add a custom link'
);

-- Someone off the project sees nothing ---------------------------------------
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000004', true);

select is(
  (select count(*)::int from public.app_project_links
   where project_id = 'd2000000-0000-4000-8000-000000000001'),
  0,
  'someone off the project sees no links at all'
);

select * from finish();
rollback;
