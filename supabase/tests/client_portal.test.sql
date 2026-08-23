begin;

create extension if not exists pgtap with schema extensions;
select plan(56);

-- Internal people ------------------------------------------------------------
insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('c0000000-0000-4000-8000-000000000001', 'portal-owner@example.test',
   '{"provider":"email","role":"owner"}', '{"full_name":"Portal Owner"}', now(), now()),
  ('c0000000-0000-4000-8000-000000000002', 'portal-member@example.test',
   '{"provider":"email"}', '{"full_name":"Portal Engineer"}', now(), now());

select is(
  (select role::text from public.app_profiles
   where id = 'c0000000-0000-4000-8000-000000000001'),
  'owner',
  'an email signup still becomes an internal profile'
);

insert into public.app_clients (id, name)
values ('c1000000-0000-4000-8000-000000000001', 'Portal Client Co');

insert into public.app_projects
  (id, client_id, name, status, lead_id, created_by, starts_on, due_on, public_id)
values
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
   'Shared Project', 'building', 'c0000000-0000-4000-8000-000000000002',
   'c0000000-0000-4000-8000-000000000001', current_date - 7, current_date + 21,
   'sharedproject1'),
  ('c2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001',
   'Other Project', 'building', null,
   'c0000000-0000-4000-8000-000000000001', current_date - 7, current_date + 21,
   'otherproject1');

-- Naming a lead already creates their membership, so this only names the job.
update public.app_project_members
set responsibility = 'Engineer'
where project_id = 'c2000000-0000-4000-8000-000000000001'
  and profile_id = 'c0000000-0000-4000-8000-000000000002';

insert into public.app_project_financials
  (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
values ('c2000000-0000-4000-8000-000000000001', 40000, 'USD', 278.5, current_date);

insert into public.app_env_groups (id, project_id, name, created_by)
values ('c5000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001', 'Root',
        'c0000000-0000-4000-8000-000000000001');

insert into public.app_project_credentials
  (id, project_id, env_group_id, name, environment, created_by)
values ('c6000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001',
        'c5000000-0000-4000-8000-000000000001',
        'STRIPE_SECRET_KEY', 'production',
        'c0000000-0000-4000-8000-000000000001');

insert into public.app_project_technical_details
  (project_id, repository_url, live_domain, staging_domain, design_url)
values ('c2000000-0000-4000-8000-000000000001',
        'https://github.com/gamma/secret-repo',
        'client.com', 'staging.client.com', 'https://figma.com/file/x');

insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
values ('c7000000-0000-4000-8000-000000000001',
        'c2000000-0000-4000-8000-000000000001', 1,
        current_date - 3, current_date + 4);

insert into public.app_milestone_cards
  (id, milestone_week_id, board, status, title, created_by)
values ('c8000000-0000-4000-8000-000000000001',
        'c7000000-0000-4000-8000-000000000001', 'work', 'in_progress',
        'Build the marketing page', 'c0000000-0000-4000-8000-000000000001');

-- If an OAuth provider is ever enabled, a stranger gets no account at all ----
insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values ('c0000000-0000-4000-8000-000000000009', 'stranger@gmail.test',
        '{"provider":"google"}', '{"full_name":"Passing Stranger"}', now(), now());

select is(
  (select count(*) from public.app_profiles
   where id = 'c0000000-0000-4000-8000-000000000009'),
  0::bigint,
  'an outside sign-in does not become an internal member'
);

select is(
  (select count(*) from public.app_client_users
   where id = 'c0000000-0000-4000-8000-000000000009'),
  0::bigint,
  'an outside sign-in does not become a client either'
);

-- An owner creates the client account outright -------------------------------
insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values ('c0000000-0000-4000-8000-000000000003', 'buyer@clientco.test',
        '{"provider":"email","role":"client"}', '{"full_name":"Client Buyer"}',
        now(), now());

select is(
  (select count(*) from public.app_client_users
   where id = 'c0000000-0000-4000-8000-000000000003'),
  1::bigint,
  'an account created with the client role becomes a client account'
);


select is(
  (select activated_at from public.app_client_users
   where id = 'c0000000-0000-4000-8000-000000000003'),
  null,
  'a new client account is pending until it signs in'
);

insert into public.app_project_client_access
  (project_id, client_user_id, granted_by)
values ('c2000000-0000-4000-8000-000000000001',
        'c0000000-0000-4000-8000-000000000003',
        'c0000000-0000-4000-8000-000000000001');

select is(
  (select can_edit_milestones from public.app_project_client_access
   where client_user_id = 'c0000000-0000-4000-8000-000000000003'),
  false,
  'a new link cannot edit the milestone board until an owner says so'
);

select is(
  (select count(*) from public.app_profiles
   where id = 'c0000000-0000-4000-8000-000000000003'),
  0::bigint,
  'a client is never given an internal profile'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

-- Even the table that grants the client their access is closed to them. The
-- portal call below is the only evidence they ever get that a link exists.
select is(
  (select count(*) from public.app_project_client_access),
  0::bigint,
  'a client cannot read the table that grants them access'
);

-- Nothing in the platform is readable ----------------------------------------
select is(
  (select count(*) from public.app_projects),
  0::bigint,
  'a client reading the projects table directly gets nothing'
);

select is(
  (select count(*) from public.app_profiles),
  0::bigint,
  'a client reading the profiles table directly gets nothing'
);

select is(
  (select count(*) from public.app_project_credentials),
  0::bigint,
  'a client reading the credentials table directly gets nothing'
);

select is(
  (select count(*) from public.app_env_groups),
  0::bigint,
  'a client cannot see that env groups exist'
);

select is(
  (select count(*) from public.app_project_financials),
  0::bigint,
  'a client reading project financials directly gets nothing'
);

select is(
  (select count(*) from public.app_employment_private),
  0::bigint,
  'a client cannot reach salaries'
);

select is(
  (select count(*) from public.app_documents),
  0::bigint,
  'a client cannot reach personal documents'
);

select is(
  (select count(*) from public.app_clients),
  0::bigint,
  'a client cannot list the client roster'
);

select is(
  (select count(*) from public.app_invoices),
  0::bigint,
  'a client cannot reach invoices'
);

select is(
  (select count(*) from public.app_project_members),
  0::bigint,
  'a client cannot read the membership table directly'
);

select is(
  (select count(*) from public.app_milestone_weeks),
  0::bigint,
  'a client cannot read milestone weeks directly'
);

select is(
  (select count(*) from public.app_project_technical_details),
  0::bigint,
  'a client cannot read technical details directly'
);

select is(
  (select count(*) from public.app_audit_logs),
  0::bigint,
  'a client cannot read the audit log'
);

select is(
  (select count(*) from public.app_client_users),
  1::bigint,
  'a client can read only their own identity row'
);

-- The portal function is the only way in --------------------------------------
select isnt(
  (select public.app_client_portal('sharedproject1')),
  null,
  'the portal function returns the linked project'
);

select is(
  (select public.app_client_portal('otherproject1')),
  null,
  'the portal function refuses a project this client is not linked to'
);

select is(
  (select public.app_client_portal('sharedproject1') #>> '{project,name}'),
  'Shared Project',
  'the payload carries the project name'
);

select ok(
  (select public.app_client_portal('sharedproject1'))::text
    not like '%github.com/gamma/secret-repo%',
  'the repository url is never in the payload'
);

select ok(
  (select public.app_client_portal('sharedproject1'))::text
    not like '%STRIPE_SECRET_KEY%',
  'no credential name reaches the payload'
);

select ok(
  (select public.app_client_portal('sharedproject1'))::text not like '%40000%',
  'the project value is never in the payload'
);

-- The Technical tab is four named fields and no fifth ------------------------
-- The Technical tab was withdrawn. The project it belongs to still has a live
-- domain, a staging domain, a design file and stack notes filled in, so these
-- pass only because the payload stopped carrying them, not because there was
-- nothing to carry.
select ok(
  (select public.app_client_portal('sharedproject1') -> 'technical') is null,
  'the payload carries no technical object at all'
);

select is(
  (select array(
     select jsonb_object_keys(public.app_client_portal('sharedproject1'))
     order by 1
   )),
  array['canEditMilestones', 'lastUpdatedAt', 'project', 'team', 'weeks'],
  'the payload holds those five keys and nothing else'
);

-- The Milestone tab ----------------------------------------------------------
select is(
  (select public.app_client_portal('sharedproject1')
     #>> '{weeks,0,items,0,title}'),
  'Build the marketing page',
  'the week and its work item reach the milestone tab'
);

select is(
  (select public.app_client_portal('sharedproject1') #>> '{canEditMilestones}'),
  'false',
  'the payload says the board is read-only for this client'
);

select isnt(
  (select public.app_client_portal('sharedproject1') #>> '{lastUpdatedAt}'),
  null,
  'the payload carries a last-updated mark'
);

select is(
  (select public.app_client_portal_preview('sharedproject1')),
  null,
  'a client cannot call the owner preview function'
);

-- Revocation bites on the next call -------------------------------------------
reset role;
update public.app_project_client_access
set revoked_at = now()
where client_user_id = 'c0000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select is(
  (select public.app_client_portal('sharedproject1')),
  null,
  'revoking access takes effect on the very next request'
);

-- The owner preview shows exactly what the client would have seen -------------
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);

select is(
  (select public.app_client_portal_preview('sharedproject1') #>> '{project,name}'),
  'Shared Project',
  'an owner can preview the portal'
);

select ok(
  (select public.app_client_portal_preview('sharedproject1'))::text
    not like '%secret-repo%',
  'the preview hides exactly what the portal hides'
);


-- Milestone editing, the one thing a client can ever write ---------------------
-- The revocation test above closed this link; reopen it so what is being
-- measured here is the switch and nothing else.
reset role;
update public.app_project_client_access
set revoked_at = null
where client_user_id = 'c0000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$select public.app_client_set_item_done(
      'c8000000-0000-4000-8000-000000000001', true
    )$$,
  '42501',
  null,
  'a read-only client cannot tick a work item'
);

select throws_ok(
  $$select public.app_client_save_week_idea(
      'c7000000-0000-4000-8000-000000000001', '{"type":"doc","content":[]}'::jsonb
    )$$,
  '42501',
  null,
  'a read-only client cannot write the week idea board'
);

reset role;
update public.app_project_client_access
set can_edit_milestones = true
where client_user_id = 'c0000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select is(
  (select public.app_client_set_item_done(
     'c8000000-0000-4000-8000-000000000001', true
   )),
  true,
  'a client with the switch on can tick a work item'
);

-- Read back as the database rather than as the client, who still cannot see
-- this table at all -- which is itself asserted a few lines further down.
reset role;

select is(
  (select status from public.app_milestone_cards
   where id = 'c8000000-0000-4000-8000-000000000001'),
  'completed',
  'ticking marks the card completed and nothing else'
);

-- Authorship branches rather than pointing a profile key at a client account.
select is(
  (select client_updated_by from public.app_milestone_cards
   where id = 'c8000000-0000-4000-8000-000000000001'),
  'c0000000-0000-4000-8000-000000000003'::uuid,
  'a client write is recorded as a client write'
);

select is(
  (select updated_by from public.app_milestone_cards
   where id = 'c8000000-0000-4000-8000-000000000001'),
  null,
  'a client write never lands in the internal author column'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select isnt(
  (select public.app_client_save_week_idea(
     'c7000000-0000-4000-8000-000000000001',
     '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
   )),
  null,
  'a client with the switch on can write the week idea board'
);

-- The switch buys exactly two verbs. Everything else still refuses.
select throws_ok(
  $$select public.app_set_milestone_card_status(
      'c8000000-0000-4000-8000-000000000001', 'blocked', 'because'
    )$$,
  '42501',
  null,
  'the internal status function still refuses a client'
);

select throws_ok(
  $$select public.app_save_week_idea_board(
      'c7000000-0000-4000-8000-000000000001', '{"type":"doc","content":[]}'::jsonb
    )$$,
  null,
  null,
  'the internal idea board function still refuses a client'
);

select is(
  (select count(*) from public.app_milestone_cards),
  0::bigint,
  'and the cards table itself is still unreadable to them'
);

-- Revoking closes the write path too, on the very next call.
reset role;
update public.app_project_client_access
set revoked_at = now()
where client_user_id = 'c0000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$select public.app_client_set_item_done(
      'c8000000-0000-4000-8000-000000000001', false
    )$$,
  '42501',
  null,
  'a revoked client cannot tick anything either'
);

reset role;
update public.app_project_client_access
set revoked_at = null
where client_user_id = 'c0000000-0000-4000-8000-000000000003';

-- Sign-in throttling ------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  $$select public.app_client_signin_gate('locktest@clientco.test', 'ip-a')$$,
  '42501',
  null,
  'nobody signing in can ask the limiter about an address'
);

select throws_ok(
  $$select public.app_client_signin_record('locktest@clientco.test', 'ip-a', true)$$,
  '42501',
  null,
  'and nobody signing in can clear their own failed attempts'
);

reset role;
set local role service_role;

select is(
  (select public.app_client_signin_gate('locktest@clientco.test', 'ip-a')),
  0,
  'a first attempt is allowed'
);

select public.app_client_signin_record('locktest@clientco.test', 'ip-a', false);
select public.app_client_signin_record('locktest@clientco.test', 'ip-a', false);
select public.app_client_signin_record('locktest@clientco.test', 'ip-a', false);
select public.app_client_signin_record('locktest@clientco.test', 'ip-a', false);
select public.app_client_signin_record('locktest@clientco.test', 'ip-a', false);

select ok(
  (select public.app_client_signin_gate('locktest@clientco.test', 'ip-a')) > 0,
  'five failures lock the address out'
);

select ok(
  (select public.app_client_signin_gate('someone-else@clientco.test', 'ip-b')) = 0,
  'an unrelated address on an unrelated network is unaffected'
);

select public.app_client_signin_record('locktest@clientco.test', 'ip-a', true);

select is(
  (select public.app_client_signin_gate('locktest@clientco.test', 'ip-c')),
  0,
  'a success clears the failures for that address'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.app_client_signin_attempts$$,
  '42501',
  null,
  'the attempt log is not readable by anyone signing in'
);

reset role;

select * from finish();
rollback;
