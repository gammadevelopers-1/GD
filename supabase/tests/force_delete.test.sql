begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('b0000000-0000-4000-8000-000000000001', 'force-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Force Owner"}', now(), now()),
  ('b0000000-0000-4000-8000-000000000002', 'force-worker@example.test',
   '{"role":"authenticated"}', '{"full_name":"Held By Work"}', now(), now()),
  ('b0000000-0000-4000-8000-000000000003', 'force-member@example.test',
   '{"role":"authenticated"}', '{"full_name":"Plain Member"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'b0000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('b1000000-0000-4000-8000-000000000001', 'Force Test Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values (
  'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'Force Test Project', 'building', 'b0000000-0000-4000-8000-000000000002'
);

insert into public.app_project_members (project_id, profile_id, added_by)
values (
  'b2000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001'
);

insert into public.app_documents
  (profile_id, document_type, file_name, storage_path, uploaded_by)
values (
  'b0000000-0000-4000-8000-000000000002', 'contract', 'held.pdf',
  'force-test/held.pdf', 'b0000000-0000-4000-8000-000000000001'
);

insert into public.app_audit_logs (actor_id, action, resource_type)
values (
  'b0000000-0000-4000-8000-000000000002', 'credential.opened', 'credential'
);

insert into public.app_milestone_weeks (id, project_id, week_number, due_on)
values (
  'b4000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000001',
  1, current_date + 7
);

insert into public.app_milestone_items
  (id, milestone_week_id, label, assigned_to, is_done, completed_at, completed_by)
values (
  'b5000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000001',
  'Finished by the deleted member',
  'b0000000-0000-4000-8000-000000000002',
  true, now(), 'b0000000-0000-4000-8000-000000000002'
);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  'b3000000-0000-4000-8000-000000000001', 'force-client@example.test',
  '{"role":"client"}', '{"full_name":"Held Client"}', now(), now()
);

insert into public.app_client_users (id, email, full_name)
values (
  'b3000000-0000-4000-8000-000000000001', 'force-client@example.test',
  'Held Client'
)
on conflict (id) do update set full_name = excluded.full_name;

insert into public.app_project_client_access (project_id, client_user_id, granted_by)
values (
  'b2000000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001'
);

insert into public.app_audit_logs (client_actor_id, action, resource_type)
values (
  'b3000000-0000-4000-8000-000000000001', 'client.milestone_ticked', 'project'
);

set local role authenticated;

select set_config(
  'request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true
);

select throws_ok(
  $$select public.app_force_delete_team_member('b0000000-0000-4000-8000-000000000002')$$,
  '42501',
  null,
  'a member cannot force delete anyone'
);

select throws_ok(
  $$select public.app_force_delete_client_account('b3000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  'a member cannot force delete a client account'
);

select set_config(
  'request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true
);

select isnt(
  public.app_team_member_deletable('b0000000-0000-4000-8000-000000000002'),
  null,
  'the guarded delete still refuses someone with history'
);

select throws_ok(
  $$select public.app_force_delete_team_member('b0000000-0000-4000-8000-000000000001')$$,
  'P0001',
  null,
  'an owner still cannot force delete themselves'
);

select is(
  public.app_force_delete_team_member('b0000000-0000-4000-8000-000000000002'),
  array['force-test/held.pdf'],
  'the force delete hands back the file to clear out of storage'
);

select is(
  (select count(*) from public.app_profiles
   where id = 'b0000000-0000-4000-8000-000000000002')::int,
  0,
  'the profile is gone despite the history that held it'
);

select is(
  (select count(*) from public.app_project_members
   where profile_id = 'b0000000-0000-4000-8000-000000000002')::int,
  0,
  'their project membership went with them'
);

select is(
  (select created_by from public.app_projects
   where id = 'b2000000-0000-4000-8000-000000000001'),
  'b0000000-0000-4000-8000-000000000001'::uuid,
  'the project they created survives, reassigned to the owner who deleted them'
);

select is(
  (select entry.metadata ->> 'deleted_actor'
   from public.app_audit_logs entry
   where entry.action = 'credential.opened'),
  'Held By Work',
  'their audit entry keeps their name after the account is erased'
);

select is(
  (select count(*) from public.app_audit_logs entry
   where entry.action = 'credential.opened' and entry.actor_id is not null)::int,
  0,
  'and no longer points at a profile row'
);

select is(
  (select completed_by from public.app_milestone_items
   where id = 'b5000000-0000-4000-8000-000000000001'),
  'b0000000-0000-4000-8000-000000000001'::uuid,
  'a completed task keeps a completer, so its check constraint still holds'
);

select is(
  (select is_done from public.app_milestone_items
   where id = 'b5000000-0000-4000-8000-000000000001'),
  true,
  'and the task is still marked done'
);

select lives_ok(
  $$select public.app_force_delete_client_account('b3000000-0000-4000-8000-000000000001')$$,
  'an owner can force delete a client account with project history'
);

select is(
  (select count(*) from public.app_project_client_access
   where client_user_id = 'b3000000-0000-4000-8000-000000000001')::int,
  0,
  'their project access went with them'
);

select * from finish();
rollback;
