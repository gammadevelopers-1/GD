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

-- ---------------------------------------------------------------------------
-- Milestone boards. Cards replace one-line items: no assignee, and the project
-- lead may author alongside the owner.
-- ---------------------------------------------------------------------------

insert into public.app_milestone_weeks (id, project_id, week_number, due_on)
values (
  '53000000-0000-4000-8000-000000000009',
  '52000000-0000-4000-8000-000000000001',
  20,
  current_date + 30
);

-- Make the existing member the project lead.
update public.app_projects
set lead_id = '50000000-0000-4000-8000-000000000002'
where id = '52000000-0000-4000-8000-000000000001';

select lives_ok(
  $$insert into public.app_milestone_cards
      (id, milestone_week_id, board, status, title, created_by)
    values (
      '54000000-0000-4000-8000-000000000001',
      '53000000-0000-4000-8000-000000000001',
      'idea', 'idea', 'Owner idea',
      '50000000-0000-4000-8000-000000000001'
    )$$,
  'an owner can add a card to the Idea Board'
);

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);

select lives_ok(
  $$insert into public.app_milestone_cards
      (id, milestone_week_id, board, status, title, created_by)
    values (
      '54000000-0000-4000-8000-000000000002',
      '53000000-0000-4000-8000-000000000001',
      'idea', 'idea', 'Lead idea',
      '50000000-0000-4000-8000-000000000002'
    )$$,
  'the project lead can add a card too'
);

select throws_ok(
  $$select public.app_set_milestone_card_status(
      '54000000-0000-4000-8000-000000000002', 'blocked', null
    )$$,
  '23514',
  'A blocked card needs a blocker.',
  'a card cannot be blocked without saying what is blocking it'
);

select lives_ok(
  $$select public.app_set_milestone_card_status(
      '54000000-0000-4000-8000-000000000002', 'blocked', 'Waiting on client DNS'
    )$$,
  'the lead can block a card with a reason'
);

select is(
  (
    select board || '/' || status
    from public.app_milestone_cards
    where id = '54000000-0000-4000-8000-000000000002'
  ),
  'work/blocked',
  'blocking moves the card onto the Work Board'
);

select lives_ok(
  $$select public.app_set_milestone_card_status(
      '54000000-0000-4000-8000-000000000002', 'completed', null
    )$$,
  'a blocked card can go on to be completed'
);

select is(
  (
    select blocker_reason
    from public.app_milestone_cards
    where id = '54000000-0000-4000-8000-000000000002'
  ),
  'Waiting on client DNS',
  'the blocker is preserved after the card is unblocked'
);

select lives_ok(
  $$select public.app_set_milestone_card_status(
      '54000000-0000-4000-8000-000000000002', 'incomplete', 'Ran out of week'
    )$$,
  'a card can be marked not completed with a reason'
);

select lives_ok(
  $$select public.app_carry_milestone_card(
      '54000000-0000-4000-8000-000000000002',
      '53000000-0000-4000-8000-000000000009',
      null
    )$$,
  'an unfinished card can be carried into another week'
);

select is(
  (
    select milestone_week_id || '|' || board || '|' || carry_reason
    from public.app_milestone_cards
    where id = '54000000-0000-4000-8000-000000000002'
  ),
  '53000000-0000-4000-8000-000000000009|idea|Ran out of week',
  'the carried card lands on the next Idea Board with its reason intact'
);

select isnt(
  (
    select carried_from_week_id
    from public.app_milestone_cards
    where id = '54000000-0000-4000-8000-000000000002'
  ),
  null,
  'the carried card remembers where it came from'
);

-- Take the lead away: an ordinary member has no authorship.
select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true
);
update public.app_projects
set lead_id = null
where id = '52000000-0000-4000-8000-000000000001';

select set_config(
  'request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true
);

select ok(
  (select count(*) from public.app_milestone_cards) >= 2,
  'a member can still read the whole board'
);

select throws_ok(
  $$insert into public.app_milestone_cards
      (milestone_week_id, board, status, title, created_by)
    values (
      '53000000-0000-4000-8000-000000000001',
      'idea', 'idea', 'Added by a plain member',
      '50000000-0000-4000-8000-000000000002'
    )$$,
  '42501',
  null,
  'a member who is not the lead cannot add a card'
);

select throws_ok(
  $$select public.app_set_milestone_card_status(
      '54000000-0000-4000-8000-000000000001', 'completed', null
    )$$,
  '42501',
  'That milestone card is unavailable.',
  'a member who is not the lead cannot move a card'
);

select throws_ok(
  $$insert into public.app_milestone_weeks (project_id, week_number, due_on)
    values ('52000000-0000-4000-8000-000000000001', 9, current_date + 20)$$,
  '42501',
  null,
  'a member cannot plan a week'
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
