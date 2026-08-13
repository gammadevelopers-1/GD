create extension if not exists pgcrypto;
create schema if not exists private;

create type public.app_user_role as enum ('owner', 'member', 'finance');
create type public.app_project_status as enum (
  'discovery', 'building', 'review', 'live', 'retainer', 'paused', 'closed'
);
create type public.app_employment_type as enum ('employee', 'contractor', 'intern');
create type public.app_document_type as enum ('contract', 'id', 'certificate', 'other');
create type public.app_currency as enum ('PKR', 'USD');
create type public.app_invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type public.cms_publish_status as enum ('draft', 'published', 'archived');

create table public.app_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.app_user_role not null default 'member',
  avatar_path text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_employment_private (
  profile_id uuid primary key references public.app_profiles(id) on delete restrict,
  employment_type public.app_employment_type not null,
  start_date date not null,
  salary_amount numeric(14, 2) check (salary_amount >= 0),
  salary_currency public.app_currency not null default 'PKR' check (salary_currency = 'PKR'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.app_profiles(id) on delete restrict,
  document_type public.app_document_type not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid not null references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.app_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.app_clients(id) on delete restrict,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  is_primary boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.app_clients(id) on delete restrict,
  name text not null,
  description text,
  status public.app_project_status not null default 'discovery',
  lead_id uuid references public.app_profiles(id) on delete restrict,
  starts_on date,
  due_on date,
  archived_at timestamptz,
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on is null or starts_on is null or due_on >= starts_on)
);

-- Store project money separately so members cannot read it.
create table public.app_project_financials (
  project_id uuid primary key references public.app_projects(id) on delete restrict,
  value_amount numeric(14, 2) not null check (value_amount >= 0),
  value_currency public.app_currency not null,
  exchange_rate_to_pkr numeric(14, 6) not null check (exchange_rate_to_pkr > 0),
  booked_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_project_members (
  project_id uuid not null references public.app_projects(id) on delete restrict,
  profile_id uuid not null references public.app_profiles(id) on delete restrict,
  responsibility text,
  added_by uuid not null references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create table public.app_milestone_weeks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete restrict,
  week_number integer not null check (week_number > 0),
  starts_on date,
  due_on date not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, week_number)
);

create table public.app_milestone_items (
  id uuid primary key default gen_random_uuid(),
  milestone_week_id uuid not null references public.app_milestone_weeks(id) on delete restrict,
  label text not null check (char_length(label) between 1 and 240),
  assigned_to uuid references public.app_profiles(id) on delete restrict,
  is_done boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.app_profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_done = false and completed_at is null and completed_by is null)
    or (is_done = true and completed_at is not null and completed_by is not null)
  )
);

create table public.app_project_technical_details (
  project_id uuid primary key references public.app_projects(id) on delete restrict,
  repository_url text,
  hosting_url text,
  live_domain text,
  staging_domain text,
  design_url text,
  technical_contact text,
  stack_notes text,
  onboarding_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id uuid not null references public.app_clients(id) on delete restrict,
  project_id uuid references public.app_projects(id) on delete restrict,
  amount numeric(14, 2) not null check (amount >= 0),
  currency public.app_currency not null,
  exchange_rate_to_pkr numeric(14, 6) not null check (exchange_rate_to_pkr > 0),
  issued_on date not null,
  due_on date not null,
  status public.app_invoice_status not null default 'draft',
  paid_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on >= issued_on),
  check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create table public.app_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.app_profiles(id) on delete restrict,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- Keep CMS data separate so public users only read published content.
create table public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status public.cms_publish_status not null default 'draft',
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create index app_documents_profile_idx on public.app_documents(profile_id) where archived_at is null;
create index app_clients_active_idx on public.app_clients(name) where archived_at is null;
create index app_contacts_client_idx on public.app_client_contacts(client_id) where archived_at is null;
create index app_projects_client_idx on public.app_projects(client_id) where archived_at is null;
create index app_projects_lead_idx on public.app_projects(lead_id) where archived_at is null;
create index app_projects_status_idx on public.app_projects(status) where archived_at is null;
create index app_project_members_profile_idx on public.app_project_members(profile_id) where archived_at is null;
create index app_milestone_weeks_project_idx on public.app_milestone_weeks(project_id) where archived_at is null;
create index app_milestone_items_week_idx on public.app_milestone_items(milestone_week_id) where archived_at is null;
create index app_invoices_client_idx on public.app_invoices(client_id) where archived_at is null;
create index app_invoices_project_idx on public.app_invoices(project_id) where archived_at is null;
create index app_invoices_status_idx on public.app_invoices(status) where archived_at is null;
create index app_audit_actor_idx on public.app_audit_logs(actor_id, occurred_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_profiles_updated before update on public.app_profiles for each row execute function private.set_updated_at();
create trigger app_employment_updated before update on public.app_employment_private for each row execute function private.set_updated_at();
create trigger app_clients_updated before update on public.app_clients for each row execute function private.set_updated_at();
create trigger app_contacts_updated before update on public.app_client_contacts for each row execute function private.set_updated_at();
create trigger app_projects_updated before update on public.app_projects for each row execute function private.set_updated_at();
create trigger app_project_financials_updated before update on public.app_project_financials for each row execute function private.set_updated_at();
create trigger app_milestone_weeks_updated before update on public.app_milestone_weeks for each row execute function private.set_updated_at();
create trigger app_milestone_items_updated before update on public.app_milestone_items for each row execute function private.set_updated_at();
create trigger app_technical_updated before update on public.app_project_technical_details for each row execute function private.set_updated_at();
create trigger app_invoices_updated before update on public.app_invoices for each row execute function private.set_updated_at();
create trigger cms_pages_updated before update on public.cms_pages for each row execute function private.set_updated_at();

create or replace function private.current_app_role()
returns public.app_user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.app_profiles
  where id = (select auth.uid()) and is_active = true and archived_at is null
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce((select private.current_app_role()) = 'owner', false) $$;

create or replace function private.is_finance()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce((select private.current_app_role()) = 'finance', false) $$;

create or replace function private.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_project_members
    where project_id = target_project_id
      and profile_id = (select auth.uid())
      and archived_at is null
  )
$$;

create or replace function private.can_view_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner())
    or (select private.is_finance())
    or (select private.is_project_member(target_project_id))
$$;

create or replace function private.can_work_on_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner()) or (select private.is_project_member(target_project_id))
$$;

create or replace function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner())
    or target_profile_id = (select auth.uid())
    or exists (
      select 1
      from public.app_project_members mine
      join public.app_project_members theirs on theirs.project_id = mine.project_id
      where mine.profile_id = (select auth.uid())
        and theirs.profile_id = target_profile_id
        and mine.archived_at is null
        and theirs.archived_at is null
    )
$$;

create or replace function private.can_view_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner())
    or (select private.is_finance())
    or exists (
      select 1 from public.app_projects project
      where project.client_id = target_client_id
        and project.archived_at is null
        and (select private.is_project_member(project.id))
    )
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.app_user_role;
begin
  requested_role := new.raw_app_meta_data ->> 'role';
  safe_role := case
    when requested_role in ('owner', 'member', 'finance') then requested_role::public.app_user_role
    else 'member'::public.app_user_role
  end;

  insert into public.app_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    safe_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

alter table public.app_profiles enable row level security;
alter table public.app_employment_private enable row level security;
alter table public.app_documents enable row level security;
alter table public.app_clients enable row level security;
alter table public.app_client_contacts enable row level security;
alter table public.app_projects enable row level security;
alter table public.app_project_financials enable row level security;
alter table public.app_project_members enable row level security;
alter table public.app_milestone_weeks enable row level security;
alter table public.app_milestone_items enable row level security;
alter table public.app_project_technical_details enable row level security;
alter table public.app_invoices enable row level security;
alter table public.app_audit_logs enable row level security;
alter table public.cms_pages enable row level security;

create policy "profiles_select_allowed" on public.app_profiles for select to authenticated
  using (archived_at is null and (select private.can_view_profile(id)));
create policy "profiles_owner_insert" on public.app_profiles for insert to authenticated
  with check ((select private.is_owner()));
create policy "profiles_owner_update" on public.app_profiles for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "employment_owner_or_self_select" on public.app_employment_private for select to authenticated
  using (archived_at is null and ((select private.is_owner()) or profile_id = (select auth.uid())));
create policy "employment_owner_insert" on public.app_employment_private for insert to authenticated
  with check ((select private.is_owner()));
create policy "employment_owner_update" on public.app_employment_private for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "documents_owner_or_self_select" on public.app_documents for select to authenticated
  using (archived_at is null and ((select private.is_owner()) or profile_id = (select auth.uid())));
create policy "documents_owner_insert" on public.app_documents for insert to authenticated
  with check ((select private.is_owner()) and uploaded_by = (select auth.uid()));
create policy "documents_owner_update" on public.app_documents for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "clients_select_allowed" on public.app_clients for select to authenticated
  using (archived_at is null and (select private.can_view_client(id)));
create policy "clients_owner_insert" on public.app_clients for insert to authenticated
  with check ((select private.is_owner()));
create policy "clients_owner_update" on public.app_clients for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "contacts_select_allowed" on public.app_client_contacts for select to authenticated
  using (archived_at is null and (select private.can_view_client(client_id)));
create policy "contacts_owner_insert" on public.app_client_contacts for insert to authenticated
  with check ((select private.is_owner()));
create policy "contacts_owner_update" on public.app_client_contacts for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "projects_select_allowed" on public.app_projects for select to authenticated
  using (archived_at is null and (select private.can_view_project(id)));
create policy "projects_owner_insert" on public.app_projects for insert to authenticated
  with check ((select private.is_owner()) and created_by = (select auth.uid()));
create policy "projects_owner_update" on public.app_projects for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "project_money_owner_finance_select" on public.app_project_financials for select to authenticated
  using ((select private.is_owner()) or (select private.is_finance()));
create policy "project_money_owner_insert" on public.app_project_financials for insert to authenticated
  with check ((select private.is_owner()));
create policy "project_money_owner_update" on public.app_project_financials for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "project_members_select_allowed" on public.app_project_members for select to authenticated
  using (archived_at is null and (select private.can_work_on_project(project_id)));
create policy "project_members_owner_insert" on public.app_project_members for insert to authenticated
  with check ((select private.is_owner()) and added_by = (select auth.uid()));
create policy "project_members_owner_update" on public.app_project_members for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "milestone_weeks_select_allowed" on public.app_milestone_weeks for select to authenticated
  using (archived_at is null and (select private.can_work_on_project(project_id)));
create policy "milestone_weeks_owner_insert" on public.app_milestone_weeks for insert to authenticated
  with check ((select private.is_owner()));
create policy "milestone_weeks_owner_update" on public.app_milestone_weeks for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "milestone_items_select_allowed" on public.app_milestone_items for select to authenticated
  using (
    archived_at is null and exists (
      select 1 from public.app_milestone_weeks week
      where week.id = milestone_week_id and (select private.can_work_on_project(week.project_id))
    )
  );
create policy "milestone_items_project_insert" on public.app_milestone_items for insert to authenticated
  with check (
    exists (
      select 1 from public.app_milestone_weeks week
      where week.id = milestone_week_id and (select private.can_work_on_project(week.project_id))
    )
  );
create policy "milestone_items_project_update" on public.app_milestone_items for update to authenticated
  using (
    exists (
      select 1 from public.app_milestone_weeks week
      where week.id = milestone_week_id and (select private.can_work_on_project(week.project_id))
    )
  )
  with check (
    exists (
      select 1 from public.app_milestone_weeks week
      where week.id = milestone_week_id and (select private.can_work_on_project(week.project_id))
    )
  );

create policy "technical_select_allowed" on public.app_project_technical_details for select to authenticated
  using ((select private.can_work_on_project(project_id)));
create policy "technical_project_insert" on public.app_project_technical_details for insert to authenticated
  with check ((select private.can_work_on_project(project_id)));
create policy "technical_project_update" on public.app_project_technical_details for update to authenticated
  using ((select private.can_work_on_project(project_id)))
  with check ((select private.can_work_on_project(project_id)));

create policy "invoices_owner_finance_select" on public.app_invoices for select to authenticated
  using (archived_at is null and ((select private.is_owner()) or (select private.is_finance())));
create policy "invoices_owner_finance_insert" on public.app_invoices for insert to authenticated
  with check (((select private.is_owner()) or (select private.is_finance())) and created_by = (select auth.uid()));
create policy "invoices_owner_finance_update" on public.app_invoices for update to authenticated
  using ((select private.is_owner()) or (select private.is_finance()))
  with check ((select private.is_owner()) or (select private.is_finance()));

create policy "audit_owner_select" on public.app_audit_logs for select to authenticated
  using ((select private.is_owner()));

create policy "cms_published_public_select" on public.cms_pages for select to anon
  using (status = 'published' and archived_at is null);
create policy "cms_owner_select" on public.cms_pages for select to authenticated
  using ((select private.is_owner()));
create policy "cms_owner_insert" on public.cms_pages for insert to authenticated
  with check ((select private.is_owner()) and created_by = (select auth.uid()));
create policy "cms_owner_update" on public.cms_pages for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

revoke all on table
  public.app_profiles,
  public.app_employment_private,
  public.app_documents,
  public.app_clients,
  public.app_client_contacts,
  public.app_projects,
  public.app_project_financials,
  public.app_project_members,
  public.app_milestone_weeks,
  public.app_milestone_items,
  public.app_project_technical_details,
  public.app_invoices,
  public.app_audit_logs
from anon;
grant select on public.cms_pages to anon;
grant select, insert, update on table
  public.app_profiles,
  public.app_employment_private,
  public.app_documents,
  public.app_clients,
  public.app_client_contacts,
  public.app_projects,
  public.app_project_financials,
  public.app_project_members,
  public.app_milestone_weeks,
  public.app_milestone_items,
  public.app_project_technical_details,
  public.app_invoices,
  public.cms_pages
to authenticated;
grant select on public.app_audit_logs to authenticated;
revoke delete on table
  public.app_profiles,
  public.app_employment_private,
  public.app_documents,
  public.app_clients,
  public.app_client_contacts,
  public.app_projects,
  public.app_project_financials,
  public.app_project_members,
  public.app_milestone_weeks,
  public.app_milestone_items,
  public.app_project_technical_details,
  public.app_invoices,
  public.app_audit_logs,
  public.cms_pages
from authenticated;

revoke all on schema private from public;
revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_owner() to authenticated;
grant execute on function private.is_finance() to authenticated;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.can_view_project(uuid) to authenticated;
grant execute on function private.can_work_on_project(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.can_view_client(uuid) to authenticated;

-- Keep employee documents private so public URLs cannot expose them.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-private-documents', 'app-private-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "private_documents_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'app-private-documents'
    and exists (
      select 1 from public.app_documents document
      where document.storage_path = name
        and document.archived_at is null
        and ((select private.is_owner()) or document.profile_id = (select auth.uid()))
    )
  );
create policy "private_documents_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'app-private-documents' and (select private.is_owner()));
create policy "private_documents_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'app-private-documents' and (select private.is_owner()))
  with check (bucket_id = 'app-private-documents' and (select private.is_owner()));

comment on table public.app_project_financials is 'Owner/finance-only project money. Never join into member DTOs.';
comment on table public.app_audit_logs is 'Append-only audit trail. Clients have no insert/update/delete policy.';
comment on table public.cms_pages is 'Published rows are the only CMS records readable by the anonymous public site.';
