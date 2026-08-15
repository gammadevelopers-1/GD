begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('50000000-0000-4000-8000-000000000001', 'chunk5-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Team Owner"}', now(), now()),
  ('50000000-0000-4000-8000-000000000002', 'chunk5-alice@example.test',
   '{"role":"authenticated"}', '{"full_name":"Alice Engineer"}', now(), now()),
  ('50000000-0000-4000-8000-000000000003', 'chunk5-bob@example.test',
   '{"role":"authenticated"}', '{"full_name":"Bob Engineer"}', now(), now()),
  ('50000000-0000-4000-8000-000000000004', 'chunk5-gone@example.test',
   '{"role":"authenticated"}', '{"full_name":"Departed Engineer"}', now(), now());

update public.app_profiles
set role = 'owner'
where id = '50000000-0000-4000-8000-000000000001';

update public.app_profiles
set is_active = false
where id = '50000000-0000-4000-8000-000000000004';

insert into public.app_clients (id, name)
values ('51000000-0000-4000-8000-000000000001', 'Team Client');

insert into public.app_projects (id, client_id, name, status, created_by)
values (
  '52000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000001',
  'Team Project',
  'building',
  '50000000-0000-4000-8000-000000000001'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);

select lives_ok(
  $$insert into public.app_project_members
      (project_id, profile_id, responsibility, added_by)
    values (
      '52000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000002',
      'Delivery engineer',
      '50000000-0000-4000-8000-000000000001'
    )$$,
  'an owner can add an active person to a project'
);

select throws_ok(
  $$insert into public.app_project_members
      (project_id, profile_id, responsibility, added_by)
    values (
      '52000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000004',
      'Should not be possible',
      '50000000-0000-4000-8000-000000000001'
    )$$,
  '23514',
  'Only an active team member can be assigned to a project.',
  'a deactivated person cannot be assigned to a project'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  1::bigint,
  'adding an assignment grants the project immediately'
);

select throws_ok(
  $$insert into public.app_project_members
      (project_id, profile_id, responsibility, added_by)
    values (
      '52000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000003',
      'Added by a member',
      '50000000-0000-4000-8000-000000000002'
    )$$,
  '42501',
  null,
  'a member cannot add anyone to a project'
);

update public.app_project_members
set responsibility = 'Promoted by themselves'
where project_id = '52000000-0000-4000-8000-000000000001'
  and profile_id = '50000000-0000-4000-8000-000000000002';

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);

select is(
  (
    select responsibility
    from public.app_project_members
    where project_id = '52000000-0000-4000-8000-000000000001'
      and profile_id = '50000000-0000-4000-8000-000000000002'
  ),
  'Delivery engineer',
  'a member cannot rewrite their own responsibility'
);

update public.app_project_members
set archived_at = now(), archived_by = '50000000-0000-4000-8000-000000000001'
where project_id = '52000000-0000-4000-8000-000000000001'
  and profile_id = '50000000-0000-4000-8000-000000000002';

select is(
  (
    select archived_by
    from public.app_project_members
    where project_id = '52000000-0000-4000-8000-000000000001'
      and profile_id = '50000000-0000-4000-8000-000000000002'
  ),
  '50000000-0000-4000-8000-000000000001'::uuid,
  'removing someone records who removed them'
);
select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '52000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'an owner can still see the archived assignment in order to restore it'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*) from public.app_project_portfolio()),
  0::bigint,
  'removing the assignment removes the project from their portfolio'
);
select is(
  (
    select count(*)
    from public.app_projects
    where id = '52000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'a removed member cannot reach the project by its id either'
);
select is(
  (select count(*) from public.app_project_members),
  0::bigint,
  'a removed member cannot read the assignment history'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);

update public.app_project_members
set archived_at = null, archived_by = null
where project_id = '52000000-0000-4000-8000-000000000001'
  and profile_id = '50000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)
    from public.app_project_members
    where project_id = '52000000-0000-4000-8000-000000000001'
      and profile_id = '50000000-0000-4000-8000-000000000002'
  ),
  1::bigint,
  'restoring reuses the original assignment rather than duplicating it'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);
select is(
  (select count(*) from public.app_project_portfolio()),
  1::bigint,
  'restoring gives the project back'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);

insert into public.app_project_members
  (project_id, profile_id, responsibility, added_by, archived_at)
values (
  '52000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000003',
  'Past contributor',
  '50000000-0000-4000-8000-000000000001',
  now()
);

reset role;
update public.app_profiles
set is_active = false
where id = '50000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);

select throws_ok(
  $$update public.app_project_members set archived_at = null
    where project_id = '52000000-0000-4000-8000-000000000001'
      and profile_id = '50000000-0000-4000-8000-000000000003'$$,
  '23514',
  'Only an active team member can be assigned to a project.',
  'a deactivated person cannot be restored onto a project'
);

select lives_ok(
  $$insert into public.app_milestone_weeks
      (id, project_id, week_number, starts_on, due_on)
    values (
      '53000000-0000-4000-8000-000000000001',
      '52000000-0000-4000-8000-000000000001',
      1, current_date - 3, current_date + 4
    )$$,
  'an owner can plan a milestone week'
);

select throws_ok(
  $$insert into public.app_milestone_weeks (project_id, week_number, due_on)
    values ('52000000-0000-4000-8000-000000000001', 1, current_date + 10)$$,
  '23505',
  null,
  'the same week number cannot be planned twice on one project'
);

insert into public.app_milestone_weeks (id, project_id, week_number, due_on)
values (
  '53000000-0000-4000-8000-000000000002',
  '52000000-0000-4000-8000-000000000001',
  2,
  current_date + 11
);

update public.app_milestone_weeks
set archived_at = now()
where id = '53000000-0000-4000-8000-000000000002';

select lives_ok(
  $$insert into public.app_milestone_weeks (project_id, week_number, due_on)
    values ('52000000-0000-4000-8000-000000000001', 2, current_date + 12)$$,
  'archiving a week frees its number for a replacement'
);

select throws_ok(
  $$insert into public.app_milestone_items (milestone_week_id, label, assigned_to)
    values (
      '53000000-0000-4000-8000-000000000001',
      'Assigned to an outsider',
      '50000000-0000-4000-8000-000000000003'
    )$$,
  '23514',
  'A milestone item can only be assigned to someone on the project team.',
  'an item cannot be assigned to someone who is not on the project team'
);

select lives_ok(
  $$insert into public.app_milestone_items
      (id, milestone_week_id, label, assigned_to)
    values (
      '54000000-0000-4000-8000-000000000001',
      '53000000-0000-4000-8000-000000000001',
      'Original label',
      '50000000-0000-4000-8000-000000000002'
    )$$,
  'an item can be assigned to someone on the project team'
);

select lives_ok(
  $$select public.app_save_milestone_item(
      '54000000-0000-4000-8000-000000000001', 'Edited label', null
    )$$,
  'an owner can edit a milestone item'
);
select is(
  (
    select label
    from public.app_milestone_items
    where id = '54000000-0000-4000-8000-000000000001'
  ),
  'Edited label',
  'the edit is applied'
);
select throws_ok(
  $$select public.app_save_milestone_item(
      '54000000-0000-4000-8000-000000000001', '   ', null
    )$$,
  '22023',
  'A milestone item needs a description.',
  'an item cannot be saved without a description'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);

select lives_ok(
  $$select public.app_toggle_milestone_item(
      '54000000-0000-4000-8000-000000000001'
    )$$,
  'an assigned member can still tick an item off'
);
select throws_ok(
  $$select public.app_save_milestone_item(
      '54000000-0000-4000-8000-000000000001', 'Rewritten by a member', null
    )$$,
  '42501',
  'Only an owner can plan milestone work.',
  'a member cannot rewrite a milestone item'
);
select throws_ok(
  $$select public.app_set_milestone_item_archived(
      '54000000-0000-4000-8000-000000000001', true
    )$$,
  '42501',
  'Only an owner can plan milestone work.',
  'a member cannot remove a milestone item'
);
select throws_ok(
  $$insert into public.app_milestone_weeks (project_id, week_number, due_on)
    values ('52000000-0000-4000-8000-000000000001', 9, current_date + 20)$$,
  '42501',
  null,
  'a member cannot plan a week'
);
select throws_ok(
  $$insert into public.app_milestone_items (milestone_week_id, label)
    values ('53000000-0000-4000-8000-000000000001', 'Added by a member')$$,
  '42501',
  null,
  'a member cannot add a milestone item'
);

update public.app_milestone_weeks
set due_on = current_date + 90
where id = '53000000-0000-4000-8000-000000000001';

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);
select is(
  (
    select due_on
    from public.app_milestone_weeks
    where id = '53000000-0000-4000-8000-000000000001'
  ),
  current_date + 4,
  'a member cannot move a week''s dates'
);

select lives_ok(
  $$select public.app_set_milestone_item_archived(
      '54000000-0000-4000-8000-000000000001', true
    )$$,
  'an owner can remove a milestone item'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);
select is(
  (
    select count(*)
    from public.app_milestone_items
    where id = '54000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'a removed item disappears from the member plan'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);
select lives_ok(
  $$select public.app_set_milestone_item_archived(
      '54000000-0000-4000-8000-000000000001', false
    )$$,
  'an owner can restore a removed milestone item'
);

update public.app_project_members
set archived_at = now(), archived_by = '50000000-0000-4000-8000-000000000001'
where project_id = '52000000-0000-4000-8000-000000000001'
  and profile_id = '50000000-0000-4000-8000-000000000002';

select lives_ok(
  $$select public.app_toggle_milestone_item(
      '54000000-0000-4000-8000-000000000001'
    )$$,
  'an item assigned to someone who has left the project can still be completed'
);

reset role;

select ok(
  not has_table_privilege(
    'authenticated', 'public.app_milestone_items', 'UPDATE'
  ),
  'planning fields are still unreachable by a direct table update'
);
select ok(
  not has_function_privilege(
    'anon', 'public.app_save_milestone_item(uuid, text, uuid)', 'EXECUTE'
  ),
  'anonymous callers cannot edit milestone items'
);
select ok(
  not has_function_privilege(
    'anon', 'public.app_set_milestone_item_archived(uuid, boolean)', 'EXECUTE'
  ),
  'anonymous callers cannot remove milestone items'
);

select * from finish();
rollback;
