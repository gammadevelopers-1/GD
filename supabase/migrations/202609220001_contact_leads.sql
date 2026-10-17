-- The enquiry form on /contact, and the inbox it lands in.
--
-- Until now the only way into this company from the website was Calendly. That
-- works for someone ready to book thirty minutes; it loses everyone who wants
-- to write a paragraph first. The form that replaces it asks enough to tell a
-- real enquiry from a tyre-kicker -- role, headcount, revenue, stage, budget,
-- timeline -- so a lead arrives already qualified rather than as a name and a
-- sentence.
--
-- Two decisions worth stating.
--
-- First, nothing here is reachable by anon. The publishable key ships in every
-- page of the marketing bundle, so a table anon can insert into is a public
-- write endpoint: anyone could fill this table at the rate their connection
-- allows, and anyone could insert a row claiming to be someone else's company.
-- The only writer is a definer function granted to service_role, called from
-- /api/contact with the secret key after that route has rate-limited the
-- address and validated every field. The form is still public; the table is
-- not.
--
-- Second, the lead row is the record and the email is a copy of it. The route
-- stores first and mails second, and records whether the mail left in
-- notified_at. A Resend outage then costs a notification, not an enquiry --
-- the lead is still in the console when someone next looks. Getting this the
-- other way round is how companies lose business they never knew arrived.

create type public.app_lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'closed',
  'spam'
);

create table if not exists public.app_contact_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who is writing
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  company text not null,
  country text not null,
  role_title text not null,

  -- What we asked so the first reply can be a useful one
  headcount text not null,
  revenue text not null,
  stage text not null,
  budget text not null,
  timeline text not null,
  summary text not null,

  -- Triage, owned by whoever works the inbox
  status public.app_lead_status not null default 'new',
  owner_note text,
  handled_by uuid references public.app_profiles(id) on delete set null,
  handled_at timestamptz,
  archived_at timestamptz,

  -- Provenance. ip_hash is salted and one-way: enough to spot one address
  -- filing twelve enquiries, not enough to be a record of who visited.
  source_path text,
  referrer text,
  ip_hash text,
  user_agent text,
  notified_at timestamptz,

  constraint app_contact_leads_first_name_length check (char_length(first_name) between 1 and 80),
  constraint app_contact_leads_last_name_length check (char_length(last_name) between 1 and 80),
  constraint app_contact_leads_email_shape check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint app_contact_leads_email_length check (char_length(email) between 5 and 254),
  constraint app_contact_leads_company_length check (char_length(company) between 1 and 160),
  constraint app_contact_leads_summary_length check (char_length(summary) between 10 and 4000),
  constraint app_contact_leads_note_length check (owner_note is null or char_length(owner_note) <= 4000)
);

comment on table public.app_contact_leads
is 'One row per enquiry from the public contact form. Written only by app_submit_contact_lead (service_role, called from /api/contact); readable and triageable by owners.';

comment on column public.app_contact_leads.notified_at
is 'When the notification email left. Null means the lead was stored but nobody was told -- work the console, not the inbox.';

comment on column public.app_contact_leads.ip_hash
is 'Salted SHA-256 of the submitting address. Present to correlate a burst of submissions, not to identify a person.';

create index if not exists app_contact_leads_inbox_idx
  on public.app_contact_leads (created_at desc)
  where archived_at is null;

create index if not exists app_contact_leads_open_idx
  on public.app_contact_leads (status, created_at desc)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- Reading and triage
-- ---------------------------------------------------------------------------

alter table public.app_contact_leads enable row level security;

drop policy if exists "contact_leads_read_owner" on public.app_contact_leads;
create policy "contact_leads_read_owner" on public.app_contact_leads
  for select to authenticated
  using ((select private.is_owner()));

-- No insert, update or delete policy. Every write goes through a function
-- below, so an owner's token cannot rewrite the body of an enquiry after the
-- fact -- the thing a client said is not a thing we get to edit.
revoke all on table public.app_contact_leads from public, anon;
grant select on table public.app_contact_leads to authenticated;

-- ---------------------------------------------------------------------------
-- The one writer
-- ---------------------------------------------------------------------------

-- Takes the whole submission as one jsonb argument so adding a question to the
-- form later is a column and a key, not a new function signature. The route
-- has already validated; the checks on the table are the backstop.
create or replace function public.app_submit_contact_lead(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.app_contact_leads (
    first_name, last_name, email, phone, company, country, role_title,
    headcount, revenue, stage, budget, timeline, summary,
    source_path, referrer, ip_hash, user_agent
  )
  values (
    payload ->> 'first_name',
    payload ->> 'last_name',
    lower(payload ->> 'email'),
    nullif(payload ->> 'phone', ''),
    payload ->> 'company',
    payload ->> 'country',
    payload ->> 'role_title',
    payload ->> 'headcount',
    payload ->> 'revenue',
    payload ->> 'stage',
    payload ->> 'budget',
    payload ->> 'timeline',
    payload ->> 'summary',
    nullif(payload ->> 'source_path', ''),
    nullif(payload ->> 'referrer', ''),
    nullif(payload ->> 'ip_hash', ''),
    nullif(payload ->> 'user_agent', '')
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.app_submit_contact_lead(jsonb)
  from public, anon, authenticated;
grant execute on function public.app_submit_contact_lead(jsonb) to service_role;

comment on function public.app_submit_contact_lead(jsonb)
is 'Service role only. The caller is /api/contact, which rate-limits the address and validates the payload; granting this to anon would make the table a public write endpoint.';

-- Marks the notification as sent. Separate from the insert because the lead is
-- stored before the mail is attempted -- see the header.
create or replace function public.app_contact_lead_notified(lead_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.app_contact_leads
  set notified_at = now()
  where id = lead_id and notified_at is null;
$$;

revoke all on function public.app_contact_lead_notified(uuid)
  from public, anon, authenticated;
grant execute on function public.app_contact_lead_notified(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Working the inbox
-- ---------------------------------------------------------------------------

-- Status, the private note and the archive flag are the only mutable parts of
-- a lead. Authorisation is repeated here rather than trusted from the server
-- action, because this is reachable by any authenticated token.
create or replace function public.app_set_contact_lead_status(
  lead_id uuid,
  next_status text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested public.app_lead_status;
begin
  if not (select private.is_owner()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  if next_status not in ('new', 'contacted', 'qualified', 'closed', 'spam') then
    raise exception 'Unknown lead status.' using errcode = '22023';
  end if;
  requested := next_status::public.app_lead_status;

  update public.app_contact_leads
  set status = requested,
      owner_note = coalesce(nullif(note, ''), owner_note),
      handled_by = case when requested = 'new' then null else (select auth.uid()) end,
      handled_at = case when requested = 'new' then null else now() end
  where id = lead_id;
end;
$$;

create or replace function public.app_archive_contact_lead(
  lead_id uuid,
  archived boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_owner()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  update public.app_contact_leads
  set archived_at = case when archived then now() else null end
  where id = lead_id;
end;
$$;

revoke all on function public.app_set_contact_lead_status(uuid, text, text)
  from public, anon;
revoke all on function public.app_archive_contact_lead(uuid, boolean)
  from public, anon;
grant execute on function public.app_set_contact_lead_status(uuid, text, text)
  to authenticated;
grant execute on function public.app_archive_contact_lead(uuid, boolean)
  to authenticated;
