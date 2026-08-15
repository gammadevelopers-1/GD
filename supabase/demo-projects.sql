-- Demo portfolio data for the Chunk 2 walkthrough.
--
-- Run it in the Supabase SQL editor. It finds the first active owner and the
-- first two active members already in the database, so it works on any
-- environment without editing ids.
--
-- Rerunning it is safe: it removes its own rows first, then recreates them.
-- To remove it entirely, run supabase/demo-projects-remove.sql.
--
-- WARNING: this writes real rows into whatever database you run it against.
-- Every row it creates is inside the d0…… id range and its clients are tagged
-- 'DEMO DATA' in their notes column, so nothing of yours is touched — but do
-- not leave it in a database the owners are using for real work.

begin;

do $$
declare
  owner_id uuid;
  member_one uuid;
  member_two uuid;

  client_northstar constant uuid := 'd0c00000-0000-4000-8000-000000000001';
  client_cedar     constant uuid := 'd0c00000-0000-4000-8000-000000000002';
  client_atlas     constant uuid := 'd0c00000-0000-4000-8000-000000000003';
  client_brightline constant uuid := 'd0c00000-0000-4000-8000-000000000004';
  client_meridian  constant uuid := 'd0c00000-0000-4000-8000-000000000005';

  p_operations constant uuid := 'd0900000-0000-4000-8000-000000000001';
  p_launch     constant uuid := 'd0900000-0000-4000-8000-000000000002';
  p_portal     constant uuid := 'd0900000-0000-4000-8000-000000000003';
  p_marketing  constant uuid := 'd0900000-0000-4000-8000-000000000004';
  p_ordering   constant uuid := 'd0900000-0000-4000-8000-000000000005';
  p_retainer   constant uuid := 'd0900000-0000-4000-8000-000000000006';
  p_migration  constant uuid := 'd0900000-0000-4000-8000-000000000007';
  p_refresh    constant uuid := 'd0900000-0000-4000-8000-000000000008';
  p_legacy     constant uuid := 'd0900000-0000-4000-8000-000000000009';

  w_ops_1 constant uuid := 'd0e00000-0000-4000-8000-000000000011';
  w_ops_2 constant uuid := 'd0e00000-0000-4000-8000-000000000012';
  w_ops_3 constant uuid := 'd0e00000-0000-4000-8000-000000000013';
  w_ops_4 constant uuid := 'd0e00000-0000-4000-8000-000000000014';
  w_lau_1 constant uuid := 'd0e00000-0000-4000-8000-000000000021';
  w_lau_2 constant uuid := 'd0e00000-0000-4000-8000-000000000022';
  w_mkt_1 constant uuid := 'd0e00000-0000-4000-8000-000000000031';
  w_mkt_2 constant uuid := 'd0e00000-0000-4000-8000-000000000032';
  w_ord_1 constant uuid := 'd0e00000-0000-4000-8000-000000000041';
  w_mig_1 constant uuid := 'd0e00000-0000-4000-8000-000000000051';
  w_ref_1 constant uuid := 'd0e00000-0000-4000-8000-000000000061';
begin
  select id into owner_id
  from public.app_profiles
  where role = 'owner' and is_active = true and archived_at is null
  order by created_at
  limit 1;

  if owner_id is null then
    raise exception 'No active owner account found. Create one before seeding demo data.';
  end if;

  select id into member_one
  from public.app_profiles
  where role = 'member' and is_active = true and archived_at is null
  order by created_at
  limit 1;

  select id into member_two
  from public.app_profiles
  where role = 'member' and is_active = true and archived_at is null
    and id is distinct from member_one
  order by created_at
  offset 0 limit 1;

  -- Clear a previous run so this stays rerunnable.
  delete from public.app_milestone_items
  where milestone_week_id in (
    select id from public.app_milestone_weeks
    where project_id in (
      select id from public.app_projects where id::text like 'd0900000%'
    )
  );
  delete from public.app_milestone_weeks
  where project_id in (
    select id from public.app_projects where id::text like 'd0900000%'
  );
  delete from public.app_project_members
  where project_id in (
    select id from public.app_projects where id::text like 'd0900000%'
  );
  delete from public.app_project_financials
  where project_id in (
    select id from public.app_projects where id::text like 'd0900000%'
  );
  delete from public.app_project_technical_details
  where project_id in (
    select id from public.app_projects where id::text like 'd0900000%'
  );
  delete from public.app_projects where id::text like 'd0900000%';
  delete from public.app_clients where id::text like 'd0c00000%';

  insert into public.app_clients (id, name, website, notes) values
    (client_northstar, 'Northstar Industries', 'https://northstar.example', 'DEMO DATA'),
    (client_cedar, 'Cedar Analytics', 'https://cedar.example', 'DEMO DATA'),
    (client_atlas, 'Atlas Holdings', 'https://atlas.example', 'DEMO DATA'),
    (client_brightline, 'Brightline Co.', 'https://brightline.example', 'DEMO DATA'),
    (client_meridian, 'Meridian Foods', 'https://meridian.example', 'DEMO DATA');

  insert into public.app_projects
    (id, client_id, name, description, status, lead_id, starts_on, due_on, archived_at, created_by)
  values
    (p_operations, client_northstar, 'Northstar Operations Platform',
     'Internal operations tooling replacing three spreadsheets and a WhatsApp group.',
     'building', coalesce(member_one, owner_id), current_date - 28, current_date + 18, null, owner_id),

    (p_launch, client_cedar, 'Cedar Analytics Launch',
     'Reporting dashboard and public marketing site for the Cedar launch.',
     'review', owner_id, current_date - 45, current_date + 6, null, owner_id),

    (p_portal, client_atlas, 'Atlas Client Portal',
     'Client-facing portal for document exchange. Scope still being agreed.',
     'discovery', owner_id, current_date - 6, current_date + 65, null, owner_id),

    (p_marketing, client_brightline, 'Brightline Marketing Site',
     'Marketing site rebuild with a custom CMS.',
     'building', coalesce(member_two, member_one, owner_id), current_date - 34, current_date - 4, null, owner_id),

    (p_ordering, client_meridian, 'Meridian Ordering App',
     'Ordering and delivery tracking app, live since last quarter.',
     'live', owner_id, current_date - 150, current_date - 30, null, owner_id),

    (p_retainer, client_northstar, 'Northstar Support Retainer',
     'Ongoing monthly support and small feature work.',
     'retainer', owner_id, current_date - 90, null, null, owner_id),

    (p_migration, client_atlas, 'Atlas Data Migration',
     'Legacy database migration. Paused while the client finishes an audit.',
     'paused', coalesce(member_one, owner_id), current_date - 60, current_date + 40, null, owner_id),

    (p_refresh, client_cedar, 'Cedar Brand Refresh',
     'Brand and identity refresh. Delivered and signed off.',
     'closed', owner_id, current_date - 200, current_date - 90, null, owner_id),

    (p_legacy, client_brightline, 'Brightline Legacy Rebuild',
     'Superseded by the marketing site rebuild.',
     'closed', owner_id, current_date - 400, current_date - 300, now(), owner_id);

  -- Owner-only money. Members must never see any of this.
  insert into public.app_project_financials
    (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
  values
    (p_operations, 24000, 'USD', 279.40, current_date - 28),
    (p_launch, 9500, 'USD', 281.10, current_date - 45),
    (p_portal, 15000, 'USD', 278.90, current_date - 6),
    (p_marketing, 6200, 'USD', 280.20, current_date - 34),
    (p_ordering, 32000, 'USD', 276.50, current_date - 150),
    (p_retainer, 180000, 'PKR', 1, current_date - 90),
    (p_migration, 4800, 'USD', 279.00, current_date - 60),
    (p_refresh, 850000, 'PKR', 1, current_date - 200);

  if member_one is not null then
    insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
    values
      (p_operations, member_one, 'Delivery engineer', owner_id),
      (p_launch, member_one, 'Frontend', owner_id),
      (p_migration, member_one, 'Data migration', owner_id)
    on conflict (project_id, profile_id) do nothing;
  end if;

  if member_two is not null then
    insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
    values
      (p_marketing, member_two, 'Project lead', owner_id),
      (p_operations, member_two, 'Backend', owner_id)
    on conflict (project_id, profile_id) do nothing;
  end if;

  insert into public.app_project_members (project_id, profile_id, responsibility, added_by)
  values
    (p_operations, owner_id, 'Account owner', owner_id),
    (p_launch, owner_id, 'Project lead', owner_id),
    (p_portal, owner_id, 'Project lead', owner_id),
    (p_ordering, owner_id, 'Project lead', owner_id),
    (p_retainer, owner_id, 'Project lead', owner_id),
    (p_refresh, owner_id, 'Project lead', owner_id)
  on conflict (project_id, profile_id) do nothing;

  insert into public.app_project_technical_details
    (project_id, repository_url, hosting_url, live_domain, staging_domain, design_url,
     technical_contact, stack_notes, onboarding_notes)
  values (
    p_operations,
    'https://github.com/gammadevelopers/northstar-operations',
    'https://vercel.com/gamma/northstar-operations',
    'https://ops.northstar.example',
    'https://staging.ops.northstar.example',
    'https://figma.com/file/demo-northstar',
    'Sara Khan — sara@northstar.example',
    'Next.js, Supabase, Tailwind, shadcn/ui.',
    'Ask an owner for env access. Staging resets every Sunday.'
  );

  -- Weekly milestones. Week 4 of the operations platform contains today, and
  -- week 2 has an unfinished item in the past, so the portfolio shows a real
  -- derived overdue signal rather than a label somebody picked.
  insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on) values
    (w_ops_1, p_operations, 1, current_date - 28, current_date - 22),
    (w_ops_2, p_operations, 2, current_date - 21, current_date - 15),
    (w_ops_3, p_operations, 3, current_date - 14, current_date - 8),
    (w_ops_4, p_operations, 4, current_date - 3, current_date + 4),
    (w_lau_1, p_launch, 1, current_date - 14, current_date - 8),
    (w_lau_2, p_launch, 2, current_date - 2, current_date + 5),
    (w_mkt_1, p_marketing, 1, current_date - 20, current_date - 14),
    (w_mkt_2, p_marketing, 2, current_date - 13, current_date - 7),
    (w_ord_1, p_ordering, 1, current_date - 60, current_date - 54),
    (w_mig_1, p_migration, 1, current_date - 30, current_date - 24),
    (w_ref_1, p_refresh, 1, current_date - 120, current_date - 114);

  insert into public.app_milestone_items
    (milestone_week_id, label, assigned_to, is_done, completed_at, completed_by)
  select
    entry.week_id,
    entry.label,
    case entry.owner_of when 'member' then coalesce(member_one, owner_id) else owner_id end,
    entry.done,
    case when entry.done then now() - interval '2 days' else null end,
    case when entry.done then owner_id else null end
  from (values
    (w_ops_1, 'Discovery workshop with the client', 'owner', true),
    (w_ops_1, 'Data model agreed', 'member', true),
    (w_ops_1, 'Repo and environments set up', 'member', true),

    (w_ops_2, 'Authentication and roles', 'member', true),
    (w_ops_2, 'Project list screen', 'member', true),
    (w_ops_2, 'Client sign-off on the data model', 'owner', false),

    (w_ops_3, 'Reporting export', 'member', true),
    (w_ops_3, 'Permissions review', 'owner', true),

    (w_ops_4, 'Weekly milestone screen', 'member', true),
    (w_ops_4, 'Mobile pass on every screen', 'member', false),
    (w_ops_4, 'Handover notes for the client team', 'owner', false),

    (w_lau_1, 'Dashboard charts', 'member', true),
    (w_lau_1, 'Marketing page copy', 'owner', true),
    (w_lau_2, 'Client review session', 'owner', true),
    (w_lau_2, 'Launch checklist', 'member', false),

    (w_mkt_1, 'Homepage build', 'member', true),
    (w_mkt_1, 'CMS content models', 'member', false),
    (w_mkt_1, 'Case study template', 'member', false),
    (w_mkt_2, 'Blog listing and post pages', 'member', false),
    (w_mkt_2, 'SEO and performance pass', 'member', false),

    (w_ord_1, 'Store rollout', 'owner', true),
    (w_ord_1, 'Driver app handover', 'owner', true),

    (w_mig_1, 'Legacy schema audit', 'member', true),
    (w_mig_1, 'Migration dry run', 'member', false),

    (w_ref_1, 'Logo and type system', 'owner', true),
    (w_ref_1, 'Brand guidelines delivered', 'owner', true)
  ) as entry(week_id, label, owner_of, done);

  raise notice 'Demo portfolio seeded. Owner: %, members wired: %',
    owner_id,
    (case when member_two is not null then 2 when member_one is not null then 1 else 0 end);
end;
$$;

commit;
