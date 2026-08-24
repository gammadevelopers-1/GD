begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('e0000000-0000-4000-8000-000000000001', 'read-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Read Owner"}', now(), now()),
  ('e0000000-0000-4000-8000-000000000002', 'read-ana@example.test',
   '{"role":"authenticated"}', '{"full_name":"Ana Reader"}', now(), now()),
  ('e0000000-0000-4000-8000-000000000003', 'read-bilal@example.test',
   '{"role":"authenticated"}', '{"full_name":"Bilal Reader"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'e0000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('e1000000-0000-4000-8000-000000000001', 'Read Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  'e2000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000001',
  'Read Project', 'building',
  'e0000000-0000-4000-8000-000000000002',
  'e0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values
  ('e2000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000002', 'Lead',
   'e0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000003', 'Engineer',
   'e0000000-0000-4000-8000-000000000001')
on conflict (project_id, profile_id) do nothing;

set local role authenticated;

-- Ana makes her own copy and puts a value in it -------------------------------
select set_config('request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$select public.app_create_personal_env_group(
      'e2000000-0000-4000-8000-000000000001', 'Ana copy')$$,
  'a member creates their own copy'
);

select lives_ok(
  $$select public.app_save_personal_env_variable(
      'e4000000-0000-4000-8000-000000000001',
      (select id from public.app_env_groups
       where project_id = 'e2000000-0000-4000-8000-000000000001'
         and owner_profile_id = 'e0000000-0000-4000-8000-000000000002'),
      'DATABASE_URL', 'cipher', 'nonce', 'tag', 1, repeat('a', 64))$$,
  'a member stores a value in their own copy'
);

select is(
  (select access from public.app_read_credential_secret(
     'e4000000-0000-4000-8000-000000000001')),
  'manage',
  'the copy owner has manage access to the value they typed in'
);

select is(
  (select allowed from public.app_read_credential_secret(
     'e4000000-0000-4000-8000-000000000001')),
  true,
  'so reading the secret out of their own copy is allowed'
);

-- Another member on the same project still gets nothing -----------------------
select set_config('request.jwt.claim.sub', 'e0000000-0000-4000-8000-000000000003', true);

select is(
  (select access from public.app_read_credential_secret(
     'e4000000-0000-4000-8000-000000000001')),
  null,
  'another member on the project is given no access level for that copy'
);

select is(
  (select allowed from public.app_read_credential_secret(
     'e4000000-0000-4000-8000-000000000001')),
  false,
  'and cannot read the secret'
);

select * from finish();
rollback;
