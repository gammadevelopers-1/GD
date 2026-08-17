-- Demo data for the board-era schema.
--
-- The older seeds (demo-projects.sql, dev-seed.sql, gamma-team-seed.sql) all
-- write to app_milestone_items, which no longer receives writes. Data seeded
-- with those will not appear on the boards. Use this one instead.
--
--   psql "$DATABASE_URL" -f supabase/demo-boards-seed.sql
--
-- Safe to run twice: every row has a fixed id and does nothing on conflict.
-- Undo with supabase/demo-boards-remove.sql.
--
-- It attaches itself to an existing owner rather than inventing accounts, so
-- it can run against a real database without creating fake people.
--
-- ENV *variables* are deliberately not seeded: their values are encrypted by
-- the application, not by SQL, so they must be added through the UI once
-- CREDENTIAL_ENCRYPTION_KEYS is set. The containers are created ready for them.

do $$
declare
  owner_id uuid;
  demo_client constant uuid := 'dd000000-0000-4000-8000-000000000001';
  demo_project constant uuid := 'dd000000-0000-4000-8000-000000000002';
  week_past constant uuid := 'dd000000-0000-4000-8000-000000000011';
  week_now constant uuid := 'dd000000-0000-4000-8000-000000000012';
  week_next constant uuid := 'dd000000-0000-4000-8000-000000000013';
begin
  select profile.id into owner_id
  from public.app_profiles profile
  where profile.role = 'owner'
    and profile.is_active = true
    and profile.archived_at is null
  order by profile.created_at
  limit 1;

  if owner_id is null then
    raise exception
      'No active owner profile found. Create an owner account and promote it first (see README.md), then re-run this seed.';
  end if;

  ------------------------------------------------------------------ client
  insert into public.app_clients (id, name)
  values (demo_client, 'Northwind Demo Co.')
  on conflict (id) do nothing;

  ----------------------------------------------------------------- project
  insert into public.app_projects
    (id, client_id, name, description, status, lead_id, starts_on, due_on, created_by)
  values (
    demo_project,
    demo_client,
    'Northwind Client Portal',
    'Demo project for trying the boards. Safe to delete.',
    'building',
    owner_id,
    current_date - 14,
    current_date + 21,
    owner_id
  )
  on conflict (id) do nothing;

  -- Owner-only money, so the value card has something to show.
  insert into public.app_project_financials
    (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
  values (demo_project, 18000, 'USD', 279.40, current_date - 20)
  on conflict (project_id) do nothing;

  --------------------------------------------------------------- technical
  insert into public.app_project_technical_details (
    project_id, repository_url, hosting_url, live_domain, staging_domain,
    design_url, technical_contact, stack_notes, onboarding_notes
  )
  values (
    demo_project,
    'https://github.com/gamma/northwind-portal',
    'https://vercel.com/gamma/northwind-portal',
    'portal.northwind.example',
    'staging.northwind.example',
    'https://figma.com/file/demo-northwind',
    'Dana Reyes — dana@northwind.example',
    'Next.js 16, Supabase, Tailwind. Node 22 locally.',
    'Ask an owner for the Frontend ENV container, then run npm run dev.'
  )
  on conflict (project_id) do nothing;

  ------------------------------------------------------------------- weeks
  insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
  values
    (week_past, demo_project, 1, current_date - 14, current_date - 8),
    (week_now,  demo_project, 2, current_date - 7,  current_date + 1),
    (week_next, demo_project, 3, current_date + 2,  current_date + 8)
  on conflict (id) do nothing;

  ------------------------------------------------------------------- cards
  -- Week 1: finished, with one that slipped so the carry-over flow is visible.
  insert into public.app_milestone_cards
    (id, milestone_week_id, board, status, title, blocks, position,
     blocker_reason, carry_reason, completed_at, created_by)
  values
    ('dd000000-0000-4000-8000-000000000101', week_past, 'work', 'completed',
     'Project kickoff and access setup',
     '[{"type":"text","text":"Repo, Vercel project and staging domain all created."}]'::jsonb,
     0, null, null, now() - interval '9 days', owner_id),

    ('dd000000-0000-4000-8000-000000000102', week_past, 'work', 'completed',
     'Design review with the client',
     '[]'::jsonb, 1, null, null, now() - interval '8 days', owner_id),

    ('dd000000-0000-4000-8000-000000000103', week_past, 'work', 'incomplete',
     'Import legacy customer data',
     '[{"type":"text","text":"Blocked on the export from their old CRM."}]'::jsonb,
     2, null, 'Client had not exported the CRM data by Friday.', null, owner_id),

    -- Week 2: the current week, one card in each state.
    ('dd000000-0000-4000-8000-000000000104', week_now, 'work', 'in_progress',
     'Build the authentication flow',
     '[{"type":"heading","level":2,"text":"Scope"},{"type":"bullet","items":["Email and password","Password reset","Session refresh"]},{"type":"callout","tone":"key","text":"SSO is explicitly out of scope for this release."}]'::jsonb,
     0, null, null, null, owner_id),

    ('dd000000-0000-4000-8000-000000000105', week_now, 'work', 'blocked',
     'Point the live domain at Vercel',
     '[{"type":"text","text":"Records are ready to go, we just cannot apply them."}]'::jsonb,
     1, 'Waiting on the client to delegate DNS. Chased twice — Dana is on leave until Monday.',
     null, null, owner_id),

    ('dd000000-0000-4000-8000-000000000106', week_now, 'work', 'completed',
     'Set up the staging environment',
     '[]'::jsonb, 2, null, null, now() - interval '2 days', owner_id),

    ('dd000000-0000-4000-8000-000000000107', week_now, 'idea', 'idea',
     'Add an audit trail to the admin actions',
     '[{"type":"text","text":"Worth doing before launch so we can answer *who changed this* later."},{"type":"callout","tone":"note","text":"Reuse the pattern from app_audit_logs rather than inventing one."}]'::jsonb,
     0, null, null, null, owner_id),

    ('dd000000-0000-4000-8000-000000000108', week_now, 'idea', 'idea',
     'Empty states for the reports screen',
     '[]'::jsonb, 1, null, null, null, owner_id),

    -- Week 3: still just ideas.
    ('dd000000-0000-4000-8000-000000000109', week_next, 'idea', 'idea',
     'Performance pass on the dashboard queries',
     '[{"type":"text","text":"The overview does several serial reads. Worth measuring before optimising."}]'::jsonb,
     0, null, null, null, owner_id),

    ('dd000000-0000-4000-8000-000000000110', week_next, 'idea', 'idea',
     'Write the handover document',
     '[]'::jsonb, 1, null, null, null, owner_id)
  on conflict (id) do nothing;

  -------------------------------------------------------- ENV containers
  -- Ready for variables, which must be added through the UI so their values
  -- are encrypted by the application.
  insert into public.app_env_groups (id, project_id, name, description, position, created_by)
  values
    ('dd000000-0000-4000-8000-000000000201', demo_project, 'Frontend ENV',
     'Everything NEXT_PUBLIC_ that ships to the browser.', 0, owner_id),
    ('dd000000-0000-4000-8000-000000000202', demo_project, 'Backend ENV',
     'Server-only keys. Never referenced from client components.', 1, owner_id),
    ('dd000000-0000-4000-8000-000000000203', demo_project, 'Root ENV',
     'Shared values used by tooling and CI.', 2, owner_id)
  on conflict (id) do nothing;

  raise notice 'Demo project seeded. Owner: %. Open it from /projects.', owner_id;
end $$;
