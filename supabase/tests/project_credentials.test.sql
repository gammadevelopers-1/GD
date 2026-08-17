begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('a0000000-0000-4000-8000-000000000001', 'chunk9-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Vault Owner"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'chunk9-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Granted Engineer"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'chunk9-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Unassigned Engineer"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'chunk9-finance@example.test',
   '{"role":"authenticated"}', '{"full_name":"Book Keeper"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000005', 'chunk9-leaver@example.test',
   '{"role":"authenticated"}', '{"full_name":"Leaving Engineer"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'a0000000-0000-4000-8000-000000000001';
update public.app_profiles set role = 'finance'
where id = 'a0000000-0000-4000-8000-000000000004';

insert into public.app_clients (id, name)
values ('a1000000-0000-4000-8000-000000000001', 'Vault Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'Vault Project', 'building', 'a0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values
  ('a2000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000002', 'Engineer',
   'a0000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000005', 'Engineer',
   'a0000000-0000-4000-8000-000000000001');

set local role authenticated;

-- Owner creates a credential ------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);

select lives_ok(
  $$select public.app_create_credential(
      'a3000000-0000-4000-8000-000000000001',
      'a2000000-0000-4000-8000-000000000001',
      'Supabase service key', 'Supabase', 'production',
      'Server side only',
      'Y2lwaGVydGV4dA==', 'bm9uY2U=', 'dGFn', 1
    )$$,
  'an owner can store a credential'
);

select is(
  (select count(*) from public.app_project_credentials
   where project_id = 'a2000000-0000-4000-8000-000000000001'),
  1::bigint,
  'the credential metadata is stored'
);

select is(
  (select action from public.app_audit_logs
   where resource_type = 'credential' order by id desc limit 1),
  'credential.created',
  'creating a credential writes an audit row'
);

select ok(
  not exists (
    select 1 from public.app_audit_logs
    where resource_type = 'credential'
      and metadata::text like '%Y2lwaGVydGV4dA%'
  ),
  'no audit row carries the stored value'
);

-- Assigned member without a grant --------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_credentials
   where project_id = 'a2000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an assigned member sees that the credential exists'
);

select throws_ok(
  $$select * from public.app_credential_secrets$$,
  '42501',
  null,
  'no signed-in role has any privilege on the encrypted values table'
);

select is(
  (select allowed from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  false,
  'being on the project does not grant the secret'
);

select is(
  (select count(*) from public.app_audit_logs),
  0::bigint,
  'a member cannot read the audit log at all'
);

select is(
  (select count(*) from public.app_credential_grants),
  0::bigint,
  'the member holds no grant'
);

-- Owner grants view access ---------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);

select lives_ok(
  $$select public.app_grant_credential_access(
      'a3000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002', 'view'
    )$$,
  'an owner can grant view access to someone on the project'
);

select throws_ok(
  $$select public.app_grant_credential_access(
      'a3000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000003', 'view'
    )$$,
  '23514',
  'That person is not on this project.',
  'a credential cannot be shared with someone who is not on the project'
);

-- The granted member ---------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true
);

select is(
  (select allowed from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  true,
  'a granted member can read the ciphertext'
);

select is(
  (select ciphertext from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  'Y2lwaGVydGV4dA==',
  'the value comes back encrypted, never in plain text'
);

select is(
  public.app_replace_credential_secret(
    'a3000000-0000-4000-8000-000000000001',
    'bmV3', 'bm9uY2U=', 'dGFn', 1
  ),
  false,
  'view access cannot replace the value'
);

select throws_ok(
  $$select public.app_create_credential(
      'a3000000-0000-4000-8000-000000000009',
      'a2000000-0000-4000-8000-000000000001',
      'Sneaky', null, 'other', null, 'eA==', 'eA==', 'eA==', 1
    )$$,
  '42501',
  'Only an owner can create a credential.',
  'a member cannot create a credential'
);

select throws_ok(
  $$select public.app_grant_credential_access(
      'a3000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000005', 'view'
    )$$,
  '42501',
  'Only an owner can manage credentials.',
  'a member cannot share a credential with anybody'
);

-- Edit access ----------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);
select public.app_grant_credential_access(
  'a3000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002', 'edit'
);

select is(
  (select action from public.app_audit_logs
   where resource_type = 'credential' order by id desc limit 1),
  'credential.access_level_changed',
  'changing the access level is recorded as a change, not a new grant'
);

select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true
);

select is(
  public.app_replace_credential_secret(
    'a3000000-0000-4000-8000-000000000001',
    'cmVwbGFjZWQ=', 'bm9uY2Uy', 'dGFnMg==', 1
  ),
  true,
  'edit access can replace the value'
);

-- Revocation -----------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);
select public.app_revoke_credential_access(
  'a3000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true
);

select is(
  (select allowed from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  false,
  'revocation takes effect on the very next request'
);

-- Leaving the project takes the secrets with it ------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);
select public.app_grant_credential_access(
  'a3000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000005', 'view'
);

update public.app_project_members
set archived_at = now(), archived_by = 'a0000000-0000-4000-8000-000000000001'
where project_id = 'a2000000-0000-4000-8000-000000000001'
  and profile_id = 'a0000000-0000-4000-8000-000000000005';

select is(
  (select count(*) from public.app_credential_grants
   where profile_id = 'a0000000-0000-4000-8000-000000000005'
     and revoked_at is null),
  0::bigint,
  'removing someone from the project revokes their credential grants'
);

select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000005', true
);

select is(
  (select allowed from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  false,
  'a removed member cannot copy through a direct request'
);

-- Deactivating an account does the same --------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true
);
select public.app_grant_credential_access(
  'a3000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002', 'view'
);

update public.app_profiles
set is_active = false
where id = 'a0000000-0000-4000-8000-000000000002';

select is(
  (select count(*) from public.app_credential_grants
   where profile_id = 'a0000000-0000-4000-8000-000000000002'
     and revoked_at is null),
  0::bigint,
  'deactivating an account revokes every grant it held'
);

-- Everyone else ---------------------------------------------------------------
select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000003', true
);

select is(
  (select count(*) from public.app_project_credentials),
  0::bigint,
  'an unassigned member cannot even see that a credential exists'
);

select set_config(
  'request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true
);

select is(
  (select count(*) from public.app_project_credentials),
  0::bigint,
  'finance never sees project credentials'
);

select is(
  (select allowed from public.app_read_credential_secret(
    'a3000000-0000-4000-8000-000000000001')),
  false,
  'finance cannot read a credential value'
);

-- The audit trail, read with no role filtering it -----------------------------
reset role;

select ok(
  exists (
    select 1 from public.app_audit_logs
    where resource_type = 'credential'
      and action = 'credential.access_denied'
      and metadata ->> 'operation' = 'copy'
      and actor_id = 'a0000000-0000-4000-8000-000000000002'
  ),
  'a refused read is recorded against the person who tried'
);

select ok(
  exists (
    select 1 from public.app_audit_logs
    where resource_type = 'credential'
      and action = 'credential.secret_copied'
      and actor_id = 'a0000000-0000-4000-8000-000000000002'
  ),
  'every copy is recorded'
);

select ok(
  exists (
    select 1 from public.app_audit_logs
    where resource_type = 'credential'
      and action = 'credential.access_denied'
      and metadata ->> 'operation' = 'replace'
  ),
  'a refused replace is recorded too'
);

select ok(
  not exists (
    select 1 from public.app_audit_logs
    where resource_type = 'credential'
      and (metadata ? 'ciphertext' or metadata ? 'value' or metadata ? 'secret')
  ),
  'no audit row carries a value field of any kind'
);

set local role anon;

select throws_ok(
  $$select * from public.app_project_credentials$$,
  '42501',
  null,
  'anonymous visitors have no privilege on credential metadata'
);

select throws_ok(
  $$select * from public.app_credential_secrets$$,
  '42501',
  null,
  'anonymous visitors have no privilege on encrypted values'
);

select ok(
  not has_function_privilege(
    'anon', 'public.app_read_credential_secret(uuid)', 'EXECUTE'
  ),
  'anonymous visitors cannot execute the credential read function'
);

reset role;

select * from finish();
rollback;
