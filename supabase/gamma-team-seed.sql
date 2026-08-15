-- Gamma team seed — real accounts, demo delivery data.
--
-- Run this once against whichever database holds the six real accounts:
--
--   Hosted:  Supabase dashboard -> SQL Editor -> paste -> Run
--   Local:   docker exec -i supabase_db_gd-website psql -U postgres -d postgres \
--              -f - < supabase/gamma-team-seed.sql
--
-- Part 1 assigns the roles. Part 2 loads clients, projects, teams and weekly
-- milestones built to exercise every rule in chunks 1-6.
--
-- Safe to re-run: it clears its own rows first. Every row it creates has an id
-- beginning ac1/ac2/ac3, and every client is marked DEMO DATA in its notes.

begin;

-- ---------------------------------------------------------------------------
-- Part 1 — roles
--
-- Matching is by first name against the account's metadata name or the part of
-- the email before the @. If someone's email looks nothing like their name
-- (gammadevelopers0@gmail.com, say), put their exact email in the third column
-- and it will be used instead. Names are normalised to the first name only.
-- ---------------------------------------------------------------------------

with wanted (first_name, app_role, email_override) as (
  values
    ('Ghulam',   'owner'::public.app_user_role,   null::text),
    ('Abubakar', 'owner'::public.app_user_role,   null::text),
    ('Hamna',    'member'::public.app_user_role,  null::text),
    ('Waheed',   'member'::public.app_user_role,  null::text),
    ('Moqeet',   'member'::public.app_user_role,  null::text),
    ('Ali',      'finance'::public.app_user_role, null::text)
),
candidate as (
  select
    wanted.first_name,
    wanted.app_role,
    account.id as user_id,
    count(*) over (partition by wanted.first_name) as hits
  from wanted
  join auth.users account
    on case
         when wanted.email_override is not null
           then lower(account.email) = lower(wanted.email_override)
         else
           -- first word of the name they signed up with, or of the profile,
           lower(split_part(
             coalesce(
               nullif(btrim(account.raw_user_meta_data ->> 'full_name'), ''),
               (select profile.full_name from public.app_profiles profile
                 where profile.id = account.id),
               split_part(account.email, '@', 1)
             ), ' ', 1)) = lower(wanted.first_name)
           -- or the first word of the email address.
           or lower(split_part(split_part(account.email, '@', 1), '.', 1))
                = lower(wanted.first_name)
           or lower(split_part(split_part(account.email, '@', 1), '_', 1))
                = lower(wanted.first_name)
       end
)
update public.app_profiles profile
set full_name = candidate.first_name,
    role = candidate.app_role,
    is_active = true,
    archived_at = null
from candidate
where profile.id = candidate.user_id
  and candidate.hits = 1;

-- Stop before seeding if anyone is missing, rather than half-loading the data.
do $$
declare
  missing text;
begin
  select string_agg(expected.first_name, ', ' order by expected.first_name)
  into missing
  from (values ('Ghulam'), ('Abubakar'), ('Hamna'), ('Waheed'), ('Moqeet'), ('Ali'))
         as expected(first_name)
  where not exists (
    select 1 from public.app_profiles profile
    where profile.full_name = expected.first_name
      and profile.is_active = true
      and profile.archived_at is null
  );

  if missing is not null then
    raise exception
      'No account matched: %. Create the account first, or put its exact email in the email_override column above.',
      missing;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Part 2 — clients, projects, teams, milestones
-- ---------------------------------------------------------------------------

do $$
declare
  ghulam   uuid;
  abubakar uuid;
  hamna    uuid;
  waheed   uuid;
  moqeet   uuid;

  c_northstar  constant uuid := 'ac100000-0000-4000-8000-000000000001';
  c_cedar      constant uuid := 'ac100000-0000-4000-8000-000000000002';
  c_atlas      constant uuid := 'ac100000-0000-4000-8000-000000000003';
  c_brightline constant uuid := 'ac100000-0000-4000-8000-000000000004';
  c_meridian   constant uuid := 'ac100000-0000-4000-8000-000000000005';
  c_lumen      constant uuid := 'ac100000-0000-4000-8000-000000000006';

  p_ops       constant uuid := 'ac200000-0000-4000-8000-000000000001';
  p_launch    constant uuid := 'ac200000-0000-4000-8000-000000000002';
  p_portal    constant uuid := 'ac200000-0000-4000-8000-000000000003';
  p_marketing constant uuid := 'ac200000-0000-4000-8000-000000000004';
  p_ordering  constant uuid := 'ac200000-0000-4000-8000-000000000005';
  p_retainer  constant uuid := 'ac200000-0000-4000-8000-000000000006';
  p_migration constant uuid := 'ac200000-0000-4000-8000-000000000007';
  p_refresh   constant uuid := 'ac200000-0000-4000-8000-000000000008';
  p_legacy    constant uuid := 'ac200000-0000-4000-8000-000000000009';
  p_bare      constant uuid := 'ac200000-0000-4000-8000-000000000010';

  w_ops_1 constant uuid := 'ac300000-0000-4000-8000-000000000011';
  w_ops_2 constant uuid := 'ac300000-0000-4000-8000-000000000012';
  w_ops_3 constant uuid := 'ac300000-0000-4000-8000-000000000013';
  w_ops_4 constant uuid := 'ac300000-0000-4000-8000-000000000014';
  w_ops_5 constant uuid := 'ac300000-0000-4000-8000-000000000015';
  w_lau_1 constant uuid := 'ac300000-0000-4000-8000-000000000021';
  w_lau_2 constant uuid := 'ac300000-0000-4000-8000-000000000022';
  w_mkt_1 constant uuid := 'ac300000-0000-4000-8000-000000000031';
  w_mkt_2 constant uuid := 'ac300000-0000-4000-8000-000000000032';
  w_ord_1 constant uuid := 'ac300000-0000-4000-8000-000000000041';
  w_mig_1 constant uuid := 'ac300000-0000-4000-8000-000000000051';
  w_ref_1 constant uuid := 'ac300000-0000-4000-8000-000000000061';
begin
  select id into ghulam   from public.app_profiles where full_name = 'Ghulam';
  select id into abubakar from public.app_profiles where full_name = 'Abubakar';
  select id into hamna    from public.app_profiles where full_name = 'Hamna';
  select id into waheed   from public.app_profiles where full_name = 'Waheed';
  select id into moqeet   from public.app_profiles where full_name = 'Moqeet';

  -- Clear the previous run of this seed, and the older demo.owner@gamma.test
  -- fixtures if they are still lying around.
  delete from public.app_milestone_items
  where milestone_week_id in (
    select id from public.app_milestone_weeks
    where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%'
  );
  delete from public.app_milestone_weeks
  where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_invoices
  where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_project_members
  where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_project_financials
  where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_project_technical_details
  where project_id::text like 'ac200000-0000-4000-8000-%' or project_id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_projects
  where id::text like 'ac200000-0000-4000-8000-%' or id::text like 'd0900000-0000-4000-8000-%';
  delete from public.app_client_contacts
  where client_id::text like 'ac100000-0000-4000-8000-%' or client_id::text like 'd0c00000-0000-4000-8000-%';
  delete from public.app_clients
  where id::text like 'ac100000-0000-4000-8000-%' or id::text like 'd0c00000-0000-4000-8000-%';

  insert into public.app_clients (id, name, website, notes) values
    (c_northstar,  'Northstar Industries', 'https://northstar.example',  'DEMO DATA'),
    (c_cedar,      'Cedar Analytics',      'https://cedar.example',      'DEMO DATA'),
    (c_atlas,      'Atlas Holdings',       'https://atlas.example',      'DEMO DATA'),
    (c_brightline, 'Brightline Co.',       'https://brightline.example', 'DEMO DATA'),
    (c_meridian,   'Meridian Foods',       'https://meridian.example',   'DEMO DATA'),
    (c_lumen,      'Lumen Labs',           'https://lumen.example',      'DEMO DATA');

  insert into public.app_client_contacts
    (client_id, full_name, email, phone, job_title, is_primary)
  values
    (c_northstar,  'Sara Khan',    'sara@northstar.example',    '+92 300 1112233', 'Head of Operations', true),
    (c_cedar,      'Daniel Reyes', 'daniel@cedar.example',      '+1 415 555 0142', 'CTO',                true),
    (c_atlas,      'Omar Farouk',  'omar@atlas.example',        '+971 50 555 0198','Programme Manager',  true),
    (c_brightline, 'Ayesha Tariq', 'ayesha@brightline.example', '+92 321 4455667', 'Marketing Lead',     true),
    (c_meridian,   'Bilal Ahmed',  'bilal@meridian.example',    '+92 333 7788990', 'Founder',            true),
    (c_lumen,      'Nadia Haq',    'nadia@lumen.example',       '+1 206 555 0173', 'Design Director',    true);

  insert into public.app_projects
    (id, client_id, name, description, status, lead_id, starts_on, due_on, archived_at, created_by)
  values
    (p_ops, c_northstar, 'Northstar Operations Platform',
     'Internal operations tooling replacing three spreadsheets and a WhatsApp group.',
     'building', hamna, current_date - 28, current_date + 18, null, ghulam),

    (p_launch, c_cedar, 'Cedar Analytics Launch',
     'Reporting dashboard and public marketing site for the Cedar launch.',
     'review', ghulam, current_date - 45, current_date + 6, null, ghulam),

    (p_portal, c_atlas, 'Atlas Client Portal',
     'Client-facing portal for document exchange. Scope still being agreed.',
     'discovery', abubakar, current_date - 6, current_date + 65, null, abubakar),

    (p_marketing, c_brightline, 'Brightline Marketing Site',
     'Marketing site rebuild with a custom CMS.',
     'building', waheed, current_date - 34, current_date - 4, null, ghulam),

    (p_ordering, c_meridian, 'Meridian Ordering App',
     'Ordering and delivery tracking app, live since last quarter.',
     'live', ghulam, current_date - 150, current_date - 30, null, ghulam),

    (p_retainer, c_northstar, 'Northstar Support Retainer',
     'Ongoing monthly support and small feature work.',
     'retainer', abubakar, current_date - 90, null, null, abubakar),

    (p_migration, c_atlas, 'Atlas Data Migration',
     'Legacy database migration. Paused while the client finishes an audit.',
     'paused', moqeet, current_date - 60, current_date + 40, null, ghulam),

    (p_refresh, c_cedar, 'Cedar Brand Refresh',
     'Brand and identity refresh. Delivered and signed off.',
     'closed', ghulam, current_date - 200, current_date - 90, null, ghulam),

    (p_legacy, c_brightline, 'Brightline Legacy Rebuild',
     'Superseded by the marketing site rebuild.',
     'closed', ghulam, current_date - 400, current_date - 300, now(), ghulam),

    -- Deliberately empty: no lead, no dates, no description, no team, no plan.
    -- This is the project that shows every missing-information prompt.
    (p_bare, c_lumen, 'Lumen Loyalty Programme',
     null, 'discovery', null, null, null, null, abubakar);

  -- Owner-only money. Never joined into a member's response.
  insert into public.app_project_financials
    (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
  values
    (p_ops,       24000,  'USD', 279.40, current_date - 28),
    (p_launch,     9500,  'USD', 281.10, current_date - 45),
    (p_portal,    15000,  'USD', 278.90, current_date - 6),
    (p_marketing,  6200,  'USD', 280.20, current_date - 34),
    (p_ordering,  32000,  'USD', 276.50, current_date - 150),
    (p_retainer, 180000,  'PKR', 279.10, current_date - 90),
    (p_migration,  4800,  'USD', 279.00, current_date - 60),
    (p_refresh,  850000,  'PKR', 276.80, current_date - 200),
    (p_legacy,   240000,  'PKR', 274.20, current_date - 400);

  -- Membership is the access grant, so this table decides what each of Hamna,
  -- Waheed and Moqeet can see. Ali is finance and is deliberately on nothing.
  insert into public.app_project_members
    (project_id, profile_id, responsibility, added_by)
  values
    (p_ops,       hamna,    'Project lead',      ghulam),
    (p_ops,       waheed,   'Backend',           ghulam),
    (p_ops,       ghulam,   'Account owner',     ghulam),

    (p_launch,    ghulam,   'Project lead',      ghulam),
    (p_launch,    moqeet,   'Reporting charts',  ghulam),

    (p_portal,    abubakar, 'Project lead',      abubakar),

    (p_marketing, waheed,   'Project lead',      ghulam),
    (p_marketing, hamna,    'Frontend',          ghulam),

    (p_ordering,  ghulam,   'Project lead',      ghulam),
    (p_ordering,  moqeet,   'Support and fixes', ghulam),

    (p_retainer,  abubakar, 'Project lead',      abubakar),

    (p_migration, moqeet,   'Data migration',    ghulam),

    (p_refresh,   ghulam,   'Project lead',      ghulam)
  -- Setting a lead already adds them to the team, so leads land here twice.
  on conflict (project_id, profile_id) do update
    set responsibility = excluded.responsibility,
        archived_at = null,
        archived_by = null;

  insert into public.app_project_technical_details
    (project_id, repository_url, hosting_url, live_domain, staging_domain, design_url,
     technical_contact, stack_notes, onboarding_notes)
  values
    (p_ops,
     'https://github.com/gammadevelopers/northstar-operations',
     'https://vercel.com/gamma/northstar-operations',
     'https://ops.northstar.example',
     'https://staging.ops.northstar.example',
     'https://figma.com/file/demo-northstar',
     'Sara Khan — sara@northstar.example',
     'Next.js, Supabase, Tailwind, shadcn/ui.',
     'Ask an owner for env access. Staging resets every Sunday.'),
    -- Half filled in, so the "not added" states have something to show.
    (p_marketing,
     'https://github.com/gammadevelopers/brightline-site',
     null,
     null,
     'https://staging.brightline.example',
     'https://figma.com/file/demo-brightline',
     null,
     'Next.js and the in-house CMS.',
     null);

  insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
  values
    -- Northstar: week 4 is today, week 2 still has an unfinished item.
    (w_ops_1, p_ops,       1, current_date - 28,  current_date - 22),
    (w_ops_2, p_ops,       2, current_date - 21,  current_date - 15),
    (w_ops_3, p_ops,       3, current_date - 14,  current_date - 8),
    (w_ops_4, p_ops,       4, current_date - 3,   current_date + 4),
    (w_lau_1, p_launch,    1, current_date - 14,  current_date - 8),
    (w_lau_2, p_launch,    2, current_date - 2,   current_date + 5),
    (w_mkt_1, p_marketing, 1, current_date - 20,  current_date - 14),
    (w_mkt_2, p_marketing, 2, current_date - 13,  current_date - 7),
    (w_ord_1, p_ordering,  1, current_date - 60,  current_date - 54),
    (w_mig_1, p_migration, 1, current_date - 30,  current_date - 24),
    (w_ref_1, p_refresh,   1, current_date - 120, current_date - 114);

  -- Archived, so Northstar has a week to restore and week 5 is free to re-plan.
  insert into public.app_milestone_weeks
    (id, project_id, week_number, starts_on, due_on, archived_at)
  values (w_ops_5, p_ops, 5, current_date + 5, current_date + 12, now());

  insert into public.app_milestone_items
    (milestone_week_id, label, assigned_to, is_done, completed_at, completed_by)
  select
    entry.week_id,
    entry.label,
    entry.assignee,
    entry.done,
    case when entry.done then now() - interval '2 days' else null end,
    case when entry.done then coalesce(entry.assignee, ghulam) else null end
  from (values
    (w_ops_1, 'Discovery workshop with the client', ghulam, true),
    (w_ops_1, 'Data model agreed',                  hamna,  true),
    (w_ops_1, 'Repo and environments set up',       waheed, true),

    (w_ops_2, 'Authentication and roles',           waheed, true),
    (w_ops_2, 'Project list screen',                hamna,  true),
    (w_ops_2, 'Client sign-off on the data model',  ghulam, false),

    (w_ops_3, 'Reporting export',                   waheed, true),
    (w_ops_3, 'Permissions review',                 ghulam, true),

    (w_ops_4, 'Weekly milestone screen',            hamna,  true),
    (w_ops_4, 'Mobile pass on every screen',        hamna,  false),
    (w_ops_4, 'Handover notes for the client team', ghulam, false),

    (w_lau_1, 'Dashboard charts',                   moqeet, true),
    (w_lau_1, 'Marketing page copy',                ghulam, true),
    (w_lau_2, 'Client review session',              ghulam, true),
    (w_lau_2, 'Launch checklist',                   moqeet, false),

    (w_mkt_1, 'Homepage build',                     waheed, true),
    (w_mkt_1, 'CMS content models',                 hamna,  false),
    (w_mkt_1, 'Case study template',                hamna,  false),
    (w_mkt_2, 'Blog listing and post pages',        waheed, false),
    (w_mkt_2, 'SEO and performance pass',           hamna,  false),

    (w_ord_1, 'Store rollout',                      ghulam, true),
    (w_ord_1, 'Driver app handover',                moqeet, true),

    (w_mig_1, 'Legacy schema audit',                moqeet, true),
    (w_mig_1, 'Migration dry run',                  moqeet, false),

    (w_ref_1, 'Logo and type system',               ghulam, true),
    (w_ref_1, 'Brand guidelines delivered',         ghulam, true)
  ) as entry(week_id, label, assignee, done);

  -- Two removed items on the current week, to restore from the Team of the tab.
  insert into public.app_milestone_items
    (milestone_week_id, label, assigned_to, is_done, archived_at)
  values
    (w_ops_4, 'Dark mode pass',              null, false, now()),
    (w_ops_4, 'Duplicate of the mobile pass', null, false, now());

  -- Added last: Waheed was on Cedar and was taken off, so he shows under
  -- "Previously on this project" and can be restored without duplicating.
  insert into public.app_project_members
    (project_id, profile_id, responsibility, added_by, archived_at, archived_by)
  values (p_launch, waheed, 'Frontend', ghulam, now() - interval '9 days', ghulam)
  on conflict (project_id, profile_id) do update
    set archived_at = excluded.archived_at,
        archived_by = excluded.archived_by;

  raise notice 'Seeded 6 clients and 10 projects for Ghulam, Abubakar, Hamna, Waheed, Moqeet. Ali is finance and on no project.';
end;
$$;

select full_name, role, is_active
from public.app_profiles
where full_name in ('Ghulam', 'Abubakar', 'Hamna', 'Waheed', 'Moqeet', 'Ali')
order by role, full_name;

commit;
