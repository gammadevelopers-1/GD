begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('c0000000-0000-4000-8000-000000000001', 'ca-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"CA Owner"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000002', 'ca-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"CA Member"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000003', 'ca-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"CA Finance"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'c0000000-0000-4000-8000-000000000001';
update public.app_profiles set role = 'finance'
where id = 'c0000000-0000-4000-8000-000000000003';

-- Clients are made through the auth admin API with role 'client', which the
-- signup trigger turns into an app_client_users row and no profile at all.
insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('c1000000-0000-4000-8000-000000000001', 'ca-fresh@example.test',
   '{"role":"client"}', '{"full_name":"Fresh Client"}', now(), now()),
  ('c1000000-0000-4000-8000-000000000002', 'ca-worked@example.test',
   '{"role":"client"}', '{"full_name":"Working Client"}', now(), now());

select is(
  (select count(*) from public.app_profiles
   where id in (
     'c1000000-0000-4000-8000-000000000001',
     'c1000000-0000-4000-8000-000000000002'
   ))::int,
  0,
  'a client never gets an app_profiles row, so every existing policy denies them'
);

insert into public.app_clients (id, name)
values ('c2000000-0000-4000-8000-000000000001', 'CA Test Company');

insert into public.app_projects (id, client_id, name, status, created_by)
values
  ('c3000000-0000-4000-8000-000000000001',
   'c2000000-0000-4000-8000-000000000001', 'CA Shared Project', 'building',
   'c0000000-0000-4000-8000-000000000001'),
  ('c3000000-0000-4000-8000-000000000002',
   'c2000000-0000-4000-8000-000000000001', 'CA Private Project', 'building',
   'c0000000-0000-4000-8000-000000000001');

insert into public.app_project_client_access
  (project_id, client_user_id, granted_by)
values
  ('c3000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000001'),
  ('c3000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000002',
   'c0000000-0000-4000-8000-000000000001');

-- One client has only ever signed in; the other has ticked something.
insert into public.app_audit_logs
  (actor_id, client_actor_id, action, resource_type)
values
  (null, 'c1000000-0000-4000-8000-000000000001', 'client.signed_in',
   'client_portal'),
  (null, 'c1000000-0000-4000-8000-000000000002', 'client.item_ticked',
   'client_portal');

-- Link state ----------------------------------------------------------------
set local role anon;

select is(
  public.app_client_link_state('c1000000-0000-4000-8000-000000000001'),
  false,
  'a client who has never set a password can use their link'
);

select is(
  public.app_client_link_state('99999999-0000-4000-8000-000000000009'),
  false,
  'an id matching nobody answers false rather than revealing an account'
);

reset role;

update public.app_client_users
set activated_at = now(), password_link_pending = false
where id = 'c1000000-0000-4000-8000-000000000001';

set local role anon;

select is(
  public.app_client_link_state('c1000000-0000-4000-8000-000000000001'),
  true,
  'once they have a password the spent link is refused'
);

reset role;

update public.app_client_users
set password_link_pending = true
where id = 'c1000000-0000-4000-8000-000000000001';

set local role anon;

select is(
  public.app_client_link_state('c1000000-0000-4000-8000-000000000001'),
  false,
  'and a link the owner just issued opens the form again'
);

reset role;

update public.app_client_users
set password_link_pending = false
where id = 'c1000000-0000-4000-8000-000000000001';

set local role authenticated;

-- Member --------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_client_users)::int,
  0,
  'a member reads no client account'
);

select throws_ok(
  $$select public.app_delete_client_account('c1000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  'a member cannot delete a client account'
);

-- Finance -------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true
);

select is(
  (select count(*) from public.app_client_users)::int,
  0,
  'finance reads no client account either'
);

select throws_ok(
  $$select public.app_delete_client_account('c1000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  'finance cannot delete a client account'
);

-- The client themselves ------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true
);

select is(
  (select count(*) from public.app_projects)::int,
  0,
  'a signed-in client holds no select policy on the projects table itself'
);

select ok(
  (select private.is_client_of('c3000000-0000-4000-8000-000000000001')),
  'they are recognised on the project they were invited to'
);

select ok(
  not (select private.is_client_of('c3000000-0000-4000-8000-000000000002')),
  'and not on the project they were not'
);

select lives_ok(
  $$select public.app_client_password_set()$$,
  'a client records setting their own password'
);

select ok(
  (select activated_at from public.app_client_users
   where id = 'c1000000-0000-4000-8000-000000000001') is not null,
  'and the stamp lands on their account'
);

-- Owner ---------------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true
);

select is(
  public.app_client_account_deletable('c1000000-0000-4000-8000-000000000002'),
  'they have activity recorded on a project',
  'a client who ticked something is held, and the reason says so'
);

select throws_ok(
  $$select public.app_delete_client_account('c1000000-0000-4000-8000-000000000002')$$,
  'P0001',
  null,
  'deleting them raises the written refusal, not a foreign key error'
);

select lives_ok(
  $$select public.app_delete_client_account('c1000000-0000-4000-8000-000000000001')$$,
  'a client who only ever signed in can be erased'
);

select is(
  (select count(*) from public.app_client_users
   where id = 'c1000000-0000-4000-8000-000000000001')::int,
  0,
  'and their account and access grants go with them'
);

reset role;

select * from finish();
rollback;
