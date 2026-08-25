begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('c0000000-0000-4000-8000-000000000001', 'tr-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Transcript Owner"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000002', 'tr-lead@example.test',
   '{"role":"authenticated"}', '{"full_name":"Transcript Lead"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000003', 'tr-outsider@example.test',
   '{"role":"authenticated"}', '{"full_name":"Transcript Outsider"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'c0000000-0000-4000-8000-000000000001';

insert into public.app_clients (id, name)
values ('c1000000-0000-4000-8000-000000000001', 'Transcript Client');

insert into public.app_projects (id, client_id, name, status, lead_id, created_by)
values (
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'Transcript Project', 'building',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000001'
);

insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
values ('c2000000-0000-4000-8000-000000000001',
        'c0000000-0000-4000-8000-000000000002', 'Engineer',
        'c0000000-0000-4000-8000-000000000001')
on conflict (project_id, profile_id) do nothing;

insert into public.app_milestone_weeks (id, project_id, week_number, due_on)
values ('c3000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001', 1, current_date + 7);

-- The tables ship locked ------------------------------------------------------

select ok(
  (select relrowsecurity from pg_class
   where oid = 'public.app_week_transcripts'::regclass),
  'app_week_transcripts has row level security on'
);

select ok(
  (select relrowsecurity from pg_class
   where oid = 'public.app_week_transcript_points'::regclass),
  'app_week_transcript_points has row level security on'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('app_week_transcripts', 'app_week_transcript_points')
     and grantee = 'authenticated'
     and privilege_type in ('INSERT', 'UPDATE', 'DELETE')),
  0,
  'neither transcript table takes a write grant -- every write is a definer call'
);

set local role authenticated;

-- The lead owns the week's transcript ------------------------------------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$select public.app_create_week_transcript(
      'c3000000-0000-4000-8000-000000000001',
      'voice', 'kickoff.m4a', 'c2000000-0000-4000-8000-000000000001/c3000000-0000-4000-8000-000000000001/kickoff.m4a',
      182
    )$$,
  'the project lead can add a source to their week'
);

select is(
  (select count(*)::int from public.app_week_transcripts
   where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'),
  1,
  'and reads it back'
);

select lives_ok(
  $$select public.app_record_transcript_points(
      (select id from public.app_week_transcripts
       where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'),
      '[{"at_seconds":72,"speaker":"Client","body":"Every task belongs to a week.","tag":"Scope"},
        {"at_seconds":220,"speaker":"Lead","body":"A weekly goal sits at the top.","tag":"Feature"}]'::jsonb
    )$$,
  'and records the points pulled out of it'
);

select is(
  (select count(*)::int from public.app_week_transcript_points
   where archived_at is null),
  2,
  'both points land'
);

select is(
  (select status from public.app_week_transcripts
   where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'),
  'ready',
  'recording points marks the source ready'
);

-- Sending a point to the Work Board writes one card, once ----------------------

select lives_ok(
  $$select public.app_send_point_to_work_board(
      (select id from public.app_week_transcript_points
       where body = 'Every task belongs to a week.')
    )$$,
  'a point can be sent to the Work Board'
);

select is(
  (select count(*)::int from public.app_milestone_cards
   where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'
     and board = 'work'),
  1,
  'which writes exactly one work card'
);

-- Pressing send twice must not duplicate the card.
select public.app_send_point_to_work_board(
  (select id from public.app_week_transcript_points
   where body = 'Every task belongs to a week.')
);

select is(
  (select count(*)::int from public.app_milestone_cards
   where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'
     and board = 'work'),
  1,
  'sending the same point again returns the card it already made'
);

-- Organising rewrites and reorders in one pass --------------------------------

select is(
  (select public.app_organise_transcript_points(
     (select id from public.app_week_transcripts
      where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'),
     (select jsonb_agg(jsonb_build_object(
        'id', id, 'body', body, 'tag', 'Scope', 'position', 5 - position))
      from public.app_week_transcript_points where archived_at is null)
   )),
  2,
  'organising touches every point of the source'
);

select is(
  (select tag from public.app_week_transcript_points
   where body = 'Every task belongs to a week.'),
  'Scope',
  'and the new tag sticks'
);

-- A junk id must be skipped, not abort the whole reshuffle.
select is(
  (select public.app_organise_transcript_points(
     (select id from public.app_week_transcripts
      where milestone_week_id = 'c3000000-0000-4000-8000-000000000001'),
     '[{"id":"not-a-uuid","body":"junk","tag":"Scope","position":0}]'::jsonb
   )),
  0,
  'a malformed id is skipped rather than raising'
);

-- Somebody with no claim on the project sees and writes nothing -----------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select is(
  (select count(*)::int from public.app_week_transcripts),
  0,
  'an unassigned account reads no transcript'
);

select is(
  (select count(*)::int from public.app_week_transcript_points),
  0,
  'and none of its points'
);

select throws_ok(
  $$select public.app_create_week_transcript(
      'c3000000-0000-4000-8000-000000000001',
      'voice', 'sneaky.m4a', 'x/y/sneaky.m4a', 10
    )$$,
  '42501',
  'You cannot add a source to this week',
  'and cannot add one of their own'
);

select * from finish();
rollback;
