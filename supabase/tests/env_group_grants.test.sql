begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('f0000000-0000-4000-8000-000000000001', 'grant-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Grant Owner"}', now(), now()),
  ('f0000000-0000-4000-8000-000000000002', 'grant-ana@example.test',
   '{"role":"authenticated"}', '{"full_name":"Ana Grantee"}', now(), now()),
  ('f0000000-0000-4000-8000-000000000003', 'grant-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Outsider Grantee"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'f0000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('f1000000-0000-4000-8000-000000000001', 'Grant Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  'f2000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000001',
  'Grant Project', 'building',
  'f0000000-0000-4000-8000-000000000002',
  'f0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values ('f2000000-0000-4000-8000-000000000001',
        'f0000000-0000-4000-8000-000000000002', 'Engineer',
        'f0000000-0000-4000-8000-000000000001')
on conflict (project_id, profile_id) do nothing;

insert into public.app_env_groups (id, project_id, name, kind, created_by)
values ('f3000000-0000-4000-8000-000000000001',
        'f2000000-0000-4000-8000-000000000001',
        'Core', 'main', 'f0000000-0000-4000-8000-000000000001');

insert into public.app_project_credentials
  (id, project_id, env_group_id, name, environment, created_by)
values ('f4000000-0000-4000-8000-000000000001',
        'f2000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'DATABASE_URL', 'other', 'f0000000-0000-4000-8000-000000000001');

insert into public.app_credential_secrets
  (credential_id, ciphertext, nonce, auth_tag, key_version, value_digest, updated_by)
values ('f4000000-0000-4000-8000-000000000001', 'c', 'n', 't', 1,
        repeat('b', 64), 'f0000000-0000-4000-8000-000000000001');

set local role authenticated;

-- Before sharing, the member sees nothing -------------------------------------
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.app_project_credentials
   where id = 'f4000000-0000-4000-8000-000000000001'),
  0,
  'before sharing, a member cannot see a main variable'
);

-- A member cannot share main with themselves ----------------------------------
select throws_ok(
  $$select public.app_share_env_group(
      'f3000000-0000-4000-8000-000000000001',
      'f0000000-0000-4000-8000-000000000002')$$,
  '42501', null,
  'a member cannot share main with themselves'
);

-- The owner shares the group --------------------------------------------------
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$select public.app_share_env_group(
      'f3000000-0000-4000-8000-000000000001',
      'f0000000-0000-4000-8000-000000000003')$$,
  'P0001', null,
  'main cannot be shared with someone who is not on the project'
);

select lives_ok(
  $$select public.app_share_env_group(
      'f3000000-0000-4000-8000-000000000001',
      'f0000000-0000-4000-8000-000000000002')$$,
  'an owner shares the whole main environment with a member'
);

-- The owner adds a key AFTER the share ----------------------------------------
reset role;

insert into public.app_project_credentials
  (id, project_id, env_group_id, name, environment, created_by)
values ('f4000000-0000-4000-8000-000000000002',
        'f2000000-0000-4000-8000-000000000001',
        'f3000000-0000-4000-8000-000000000001',
        'STRIPE_SECRET_KEY', 'other', 'f0000000-0000-4000-8000-000000000001');

insert into public.app_credential_secrets
  (credential_id, ciphertext, nonce, auth_tag, key_version, value_digest, updated_by)
values ('f4000000-0000-4000-8000-000000000002', 'c2', 'n2', 't2', 1,
        repeat('c', 64), 'f0000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.app_project_credentials
   where env_group_id = 'f3000000-0000-4000-8000-000000000001'),
  2,
  'a key added to main after the share still reaches the member'
);

select is(
  (select allowed from public.app_read_credential_secret(
     'f4000000-0000-4000-8000-000000000002')),
  true,
  'and its value is readable without a per-variable grant'
);

-- Revoking takes it all back --------------------------------------------------
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.app_revoke_env_group(
      'f3000000-0000-4000-8000-000000000001',
      'f0000000-0000-4000-8000-000000000002')$$,
  'an owner revokes the share'
);

select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.app_project_credentials
   where env_group_id = 'f3000000-0000-4000-8000-000000000001'),
  0,
  'and the member sees nothing again'
);

select * from finish();
rollback;
