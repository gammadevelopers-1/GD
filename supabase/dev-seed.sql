begin;

do $$
declare
  owner_id uuid;
  member_id uuid;
begin
  select id
  into owner_id
  from auth.users
  where lower(email) = 'ghulam.owner@example.com';

  select id
  into member_id
  from auth.users
  where lower(email) = 'hamna.member@example.com';

  if owner_id is null then
    raise exception 'Create ghulam.owner@example.com in Authentication > Users first';
  end if;

  if member_id is null then
    raise exception 'Create hamna.member@example.com in Authentication > Users first';
  end if;

  insert into public.app_profiles (
    id,
    full_name,
    role,
    is_active,
    archived_at
  )
  values
    (owner_id, 'Ghulam Mustafa', 'owner', true, null),
    (member_id, 'Hamna Khan', 'member', true, null)
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = true,
    archived_at = null;

  insert into public.app_employment_private (
    profile_id,
    employment_type,
    start_date,
    salary_amount,
    salary_currency,
    archived_at
  )
  values
    (owner_id, 'employee', current_date - 900, 650000, 'PKR', null),
    (member_id, 'employee', current_date - 420, 220000, 'PKR', null)
  on conflict (profile_id) do update
  set
    employment_type = excluded.employment_type,
    start_date = excluded.start_date,
    salary_amount = excluded.salary_amount,
    salary_currency = excluded.salary_currency,
    archived_at = null;

  insert into public.app_clients (id, name, website, notes, archived_at)
  values
    (
      '10000000-0000-4000-8000-000000000001',
      'Northstar Foods [DEMO]',
      'https://northstar-foods.example',
      'Demo client for testing an active web-platform engagement.',
      null
    ),
    (
      '10000000-0000-4000-8000-000000000002',
      'Cedar Analytics [DEMO]',
      'https://cedar-analytics.example',
      'Demo client visible to the owner but not to an unassigned member.',
      null
    )
  on conflict (id) do update
  set
    name = excluded.name,
    website = excluded.website,
    notes = excluded.notes,
    archived_at = null;

  insert into public.app_client_contacts (
    id,
    client_id,
    full_name,
    email,
    phone,
    job_title,
    is_primary,
    archived_at
  )
  values
    (
      '11000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'Ayesha Noor',
      'ayesha@northstar-foods.example',
      '+92 300 000 0101',
      'Operations Director',
      true,
      null
    ),
    (
      '11000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      'Daniyal Shah',
      'daniyal@cedar-analytics.example',
      '+92 300 000 0202',
      'Founder',
      true,
      null
    )
  on conflict (id) do update
  set
    client_id = excluded.client_id,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    job_title = excluded.job_title,
    is_primary = excluded.is_primary,
    archived_at = null;

  insert into public.app_projects (
    id,
    client_id,
    name,
    description,
    status,
    lead_id,
    starts_on,
    due_on,
    archived_at,
    created_by
  )
  values
    (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'Northstar Operations Platform [DEMO]',
      'Responsive operations dashboard and internal workflow rebuild.',
      'building',
      member_id,
      current_date - 21,
      current_date + 10,
      null,
      owner_id
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      'Cedar Analytics Launch [DEMO]',
      'Marketing site, launch assets, and analytics implementation.',
      'review',
      owner_id,
      current_date - 35,
      current_date + 28,
      null,
      owner_id
    )
  on conflict (id) do update
  set
    client_id = excluded.client_id,
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    lead_id = excluded.lead_id,
    starts_on = excluded.starts_on,
    due_on = excluded.due_on,
    archived_at = null,
    created_by = excluded.created_by;

  insert into public.app_project_financials (
    project_id,
    value_amount,
    value_currency,
    exchange_rate_to_pkr,
    booked_on
  )
  values
    (
      '20000000-0000-4000-8000-000000000001',
      2800000,
      'PKR',
      1,
      current_date - 30
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      3800,
      'USD',
      280,
      current_date - 45
    )
  on conflict (project_id) do update
  set
    value_amount = excluded.value_amount,
    value_currency = excluded.value_currency,
    exchange_rate_to_pkr = excluded.exchange_rate_to_pkr,
    booked_on = excluded.booked_on;

  insert into public.app_project_members (
    project_id,
    profile_id,
    responsibility,
    added_by,
    archived_at
  )
  values
    (
      '20000000-0000-4000-8000-000000000001',
      owner_id,
      'Executive oversight and client relationship',
      owner_id,
      null
    ),
    (
      '20000000-0000-4000-8000-000000000001',
      member_id,
      'Frontend delivery and milestone ownership',
      owner_id,
      null
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      owner_id,
      'Project lead and launch approval',
      owner_id,
      null
    )
  on conflict (project_id, profile_id) do update
  set
    responsibility = excluded.responsibility,
    added_by = excluded.added_by,
    archived_at = null;

  insert into public.app_milestone_weeks (
    id,
    project_id,
    week_number,
    starts_on,
    due_on,
    archived_at
  )
  values
    (
      '30000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      1,
      current_date - 14,
      current_date - 7,
      null
    ),
    (
      '30000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      2,
      current_date - 2,
      current_date + 5,
      null
    ),
    (
      '30000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000002',
      1,
      current_date,
      current_date + 7,
      null
    )
  on conflict (id) do update
  set
    project_id = excluded.project_id,
    week_number = excluded.week_number,
    starts_on = excluded.starts_on,
    due_on = excluded.due_on,
    archived_at = null;

  insert into public.app_milestone_items (
    id,
    milestone_week_id,
    label,
    assigned_to,
    is_done,
    completed_at,
    completed_by,
    archived_at
  )
  values
    (
      '31000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      'Approve responsive dashboard wireframes',
      member_id,
      true,
      now() - interval '9 days',
      member_id,
      null
    ),
    (
      '31000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      'Confirm legacy data import mapping',
      member_id,
      false,
      null,
      null,
      null
    ),
    (
      '31000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000002',
      'Connect authenticated project dashboard',
      member_id,
      false,
      null,
      null,
      null
    ),
    (
      '31000000-0000-4000-8000-000000000004',
      '30000000-0000-4000-8000-000000000002',
      'Test member permissions on mobile',
      member_id,
      false,
      null,
      null,
      null
    ),
    (
      '31000000-0000-4000-8000-000000000005',
      '30000000-0000-4000-8000-000000000003',
      'Review launch analytics checklist',
      owner_id,
      true,
      now() - interval '1 day',
      owner_id,
      null
    )
  on conflict (id) do update
  set
    milestone_week_id = excluded.milestone_week_id,
    label = excluded.label,
    assigned_to = excluded.assigned_to,
    is_done = excluded.is_done,
    completed_at = excluded.completed_at,
    completed_by = excluded.completed_by,
    archived_at = null;

  insert into public.app_project_technical_details (
    project_id,
    repository_url,
    hosting_url,
    live_domain,
    staging_domain,
    design_url,
    technical_contact,
    stack_notes,
    onboarding_notes
  )
  values
    (
      '20000000-0000-4000-8000-000000000001',
      'https://github.com/example/northstar-demo',
      'https://vercel.com/example/northstar-demo',
      'https://northstar-foods.example',
      'https://staging.northstar-foods.example',
      'https://figma.com/file/example/northstar-demo',
      'Hamna Khan',
      'Next.js, Supabase, Tailwind, and shadcn/ui.',
      'All values and external links in this record are demo-only.'
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      'https://github.com/example/cedar-demo',
      'https://vercel.com/example/cedar-demo',
      'https://cedar-analytics.example',
      'https://staging.cedar-analytics.example',
      'https://figma.com/file/example/cedar-demo',
      'Ghulam Mustafa',
      'Next.js marketing site with privacy-friendly analytics.',
      'Owner-only demo project for testing row-level access.'
    )
  on conflict (project_id) do update
  set
    repository_url = excluded.repository_url,
    hosting_url = excluded.hosting_url,
    live_domain = excluded.live_domain,
    staging_domain = excluded.staging_domain,
    design_url = excluded.design_url,
    technical_contact = excluded.technical_contact,
    stack_notes = excluded.stack_notes,
    onboarding_notes = excluded.onboarding_notes;

  insert into public.app_invoices (
    id,
    invoice_number,
    client_id,
    project_id,
    amount,
    currency,
    exchange_rate_to_pkr,
    issued_on,
    due_on,
    status,
    paid_at,
    archived_at,
    created_by
  )
  values
    (
      '40000000-0000-4000-8000-000000000001',
      'DEMO-2026-001',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      620000,
      'PKR',
      1,
      current_date - 20,
      current_date - 5,
      'paid',
      now() - interval '2 days',
      null,
      owner_id
    ),
    (
      '40000000-0000-4000-8000-000000000002',
      'DEMO-2026-002',
      '10000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000002',
      1800,
      'USD',
      280,
      current_date - 8,
      current_date + 7,
      'sent',
      null,
      null,
      owner_id
    ),
    (
      '40000000-0000-4000-8000-000000000003',
      'DEMO-2026-003',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      240000,
      'PKR',
      1,
      current_date - 25,
      current_date - 10,
      'overdue',
      null,
      null,
      owner_id
    )
  on conflict (id) do update
  set
    invoice_number = excluded.invoice_number,
    client_id = excluded.client_id,
    project_id = excluded.project_id,
    amount = excluded.amount,
    currency = excluded.currency,
    exchange_rate_to_pkr = excluded.exchange_rate_to_pkr,
    issued_on = excluded.issued_on,
    due_on = excluded.due_on,
    status = excluded.status,
    paid_at = excluded.paid_at,
    archived_at = null,
    created_by = excluded.created_by;

  insert into public.cms_pages (
    id,
    slug,
    title,
    content,
    status,
    published_at,
    archived_at,
    created_by
  )
  values (
    '50000000-0000-4000-8000-000000000001',
    'demo-capabilities',
    'Capabilities [DEMO]',
    jsonb_build_object(
      'eyebrow', 'How Gamma helps',
      'headline', 'Digital products built with clarity.',
      'body', 'This is safe demo CMS content.'
    ),
    'published',
    now(),
    null,
    owner_id
  )
  on conflict (id) do update
  set
    slug = excluded.slug,
    title = excluded.title,
    content = excluded.content,
    status = excluded.status,
    published_at = excluded.published_at,
    archived_at = null,
    created_by = excluded.created_by;
end;
$$;

commit;

select
  profile.full_name,
  auth_user.email,
  profile.role,
  employment.employment_type,
  employment.start_date
from public.app_profiles profile
join auth.users auth_user on auth_user.id = profile.id
left join public.app_employment_private employment
  on employment.profile_id = profile.id
where lower(auth_user.email) in (
  'ghulam.owner@example.com',
  'hamna.member@example.com'
)
order by profile.role;
