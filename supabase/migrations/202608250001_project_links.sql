-- Working links become rows instead of columns.
--
-- app_project_technical_details holds one fixed column per link, so the tab
-- could only ever show the seven links someone thought of in advance, under
-- the labels they chose. A project that lives on a status page, an analytics
-- dashboard or a second staging host had nowhere to put it.
--
-- Every link is now a row: the seven predefined ones carry a slug and cannot
-- be removed (only cleared), anything else is a custom row an owner adds and
-- can delete outright. Labels are editable on both kinds.
--
-- The old table is left in place and untouched -- the pilot-readiness report
-- and the seed files still read it -- but the Technical tab reads this.

create table if not exists public.app_project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.app_projects(id) on delete cascade,
  slug text,
  label text not null,
  kind text not null default 'link',
  value text not null default '',
  position integer not null default 0,
  created_by uuid references public.app_profiles(id) on delete set null,
  updated_by uuid references public.app_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_project_links_kind_check
    check (kind in ('link', 'notes')),
  constraint app_project_links_slug_check
    check (slug is null or slug in (
      'repository', 'hosting', 'live', 'staging', 'design', 'stack', 'onboarding'
    )),
  constraint app_project_links_label_check
    check (char_length(btrim(label)) between 1 and 80),
  constraint app_project_links_value_check
    check (char_length(value) <= 4000)
);

create unique index if not exists app_project_links_slug_key
  on public.app_project_links (project_id, slug)
  where slug is not null;

create index if not exists app_project_links_project_idx
  on public.app_project_links (project_id, position, created_at);

-- ---------------------------------------------------------------------------
-- Validation: the same rules the old column trigger enforced, per row
-- ---------------------------------------------------------------------------

create or replace function private.validate_project_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.label := btrim(new.label);
  new.value := btrim(new.value);

  if (select private.looks_like_secret(new.label)) then
    raise exception 'A link label may not contain a secret.'
      using errcode = '23514';
  end if;

  if (select private.looks_like_secret(new.value)) then
    raise exception 'A working link may not contain a secret. Put it in the environment variables instead.'
      using errcode = '23514';
  end if;

  if new.kind = 'link' and new.value <> '' then
    if not (
      (select private.is_web_url(new.value))
      or (select private.is_web_host(new.value))
    ) then
      raise exception 'That does not look like a web address.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_project_link on public.app_project_links;
create trigger validate_project_link
  before insert or update on public.app_project_links
  for each row execute function private.validate_project_link();

drop trigger if exists set_project_link_updated_at on public.app_project_links;
create trigger set_project_link_updated_at
  before update on public.app_project_links
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.app_project_links enable row level security;

drop policy if exists project_links_select_allowed on public.app_project_links;
create policy project_links_select_allowed
  on public.app_project_links for select
  using ((select private.can_view_project(project_id)));

-- No insert/update/delete policy, and no write grant: a working link changes
-- only through the functions below. They are the only place that writes the
-- audit entry, so a caller who could write the table directly could also make
-- a change that never appears in the history.

revoke all on table public.app_project_links from anon, authenticated;
grant select on table public.app_project_links to authenticated;

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

create or replace function private.record_link_event(
  target_link_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata, ip)
  values (
    (select auth.uid()),
    action_name,
    'project_link',
    target_link_id,
    coalesce(event_metadata, '{}'::jsonb),
    nullif(
      btrim(split_part(
        coalesce(
          (nullif(current_setting('request.headers', true), '')::json
            ->> 'x-gamma-client-ip'),
          ''
        ),
        ',',
        1
      )),
      ''
    )
  )
$$;

-- ---------------------------------------------------------------------------
-- Seed the seven predefined rows for every project, carrying the old values
-- ---------------------------------------------------------------------------

insert into public.app_project_links (project_id, slug, label, kind, value, position)
select
  project.id,
  seed.slug,
  seed.label,
  seed.kind,
  coalesce(
    case seed.slug
      when 'repository' then technical.repository_url
      when 'hosting' then technical.hosting_url
      when 'live' then technical.live_domain
      when 'staging' then technical.staging_domain
      when 'design' then technical.design_url
      when 'stack' then technical.stack_notes
      when 'onboarding' then technical.onboarding_notes
    end,
    ''
  ),
  seed.position
from public.app_projects project
cross join (values
  ('repository', 'Repository', 'link', 0),
  ('hosting', 'Hosting / deployment project', 'link', 1),
  ('live', 'Live domain', 'link', 2),
  ('staging', 'Staging domain', 'link', 3),
  ('design', 'Design file', 'link', 4),
  ('stack', 'Stack notes', 'notes', 5),
  ('onboarding', 'Onboarding notes', 'notes', 6)
) as seed(slug, label, kind, position)
left join public.app_project_technical_details technical
  on technical.project_id = project.id
on conflict do nothing;

-- A project created after this migration needs its seven rows too.
create or replace function private.seed_project_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_project_links (project_id, slug, label, kind, position)
  values
    (new.id, 'repository', 'Repository', 'link', 0),
    (new.id, 'hosting', 'Hosting / deployment project', 'link', 1),
    (new.id, 'live', 'Live domain', 'link', 2),
    (new.id, 'staging', 'Staging domain', 'link', 3),
    (new.id, 'design', 'Design file', 'link', 4),
    (new.id, 'stack', 'Stack notes', 'notes', 5),
    (new.id, 'onboarding', 'Onboarding notes', 'notes', 6)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists seed_project_links on public.app_projects;
create trigger seed_project_links
  after insert on public.app_projects
  for each row execute function private.seed_project_links();

comment on table public.app_project_links is
  'Working links for a project. Rows with a slug are the predefined seven: they can be cleared and relabelled but never deleted. Rows without one are custom links an owner or lead added.';

-- ---------------------------------------------------------------------------
-- Mutations
--
-- These run with invoker rights on purpose: the policies above are the only
-- permission check, so there is no second copy of the rule to drift. The audit
-- write is the one definer step, because a caller may not write the log itself.
-- ---------------------------------------------------------------------------

create or replace function public.app_set_project_link(
  target_link_id uuid,
  new_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_label text;
  row_project uuid;
  was_empty boolean;
begin
  select link.label, link.project_id, link.value = ''
    into row_label, row_project, was_empty
  from public.app_project_links link
  where link.id = target_link_id;

  if row_label is null then
    raise exception 'That link no longer exists.' using errcode = 'P0001';
  end if;

  if not (select private.can_manage_project(row_project)) then
    raise exception 'Only an owner or the project lead can change working links.'
      using errcode = '42501';
  end if;

  update public.app_project_links link
  set value = coalesce(new_value, ''),
      updated_by = (select auth.uid())
  where link.id = target_link_id;

  perform private.record_link_event(
    target_link_id,
    case when was_empty then 'create' else 'update' end,
    jsonb_build_object(
      'project_id', row_project,
      'label', row_label,
      'detail', case when was_empty then 'Set link' else 'Updated link' end
    )
  );
end;
$$;

create or replace function public.app_rename_project_link(
  target_link_id uuid,
  new_label text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_label text;
  row_project uuid;
begin
  select link.label, link.project_id into old_label, row_project
  from public.app_project_links link
  where link.id = target_link_id;

  if old_label is null then
    raise exception 'That link no longer exists.' using errcode = 'P0001';
  end if;

  if not (select private.can_manage_project(row_project)) then
    raise exception 'Only an owner or the project lead can rename working links.'
      using errcode = '42501';
  end if;

  update public.app_project_links link
  set label = new_label,
      updated_by = (select auth.uid())
  where link.id = target_link_id;

  perform private.record_link_event(
    target_link_id,
    'update',
    jsonb_build_object(
      'project_id', row_project,
      'label', btrim(new_label),
      'detail', format('Renamed link %L to %L', old_label, btrim(new_label))
    )
  );
end;
$$;

create or replace function public.app_clear_project_link(target_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_label text;
  row_project uuid;
begin
  select link.label, link.project_id into row_label, row_project
  from public.app_project_links link
  where link.id = target_link_id;

  if row_label is null then
    raise exception 'That link no longer exists.' using errcode = 'P0001';
  end if;

  if not (select private.can_manage_project(row_project)) then
    raise exception 'Only an owner or the project lead can clear working links.'
      using errcode = '42501';
  end if;

  update public.app_project_links link
  set value = '',
      updated_by = (select auth.uid())
  where link.id = target_link_id;

  perform private.record_link_event(
    target_link_id,
    'delete',
    jsonb_build_object(
      'project_id', row_project,
      'label', row_label,
      'detail', format('Cleared link %L', row_label)
    )
  );
end;
$$;

create or replace function public.app_add_project_link(
  target_project_id uuid,
  new_label text,
  new_value text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  next_position integer;
begin
  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Only an owner or the project lead can add working links.'
      using errcode = '42501';
  end if;

  select coalesce(max(link.position), 0) + 1 into next_position
  from public.app_project_links link
  where link.project_id = target_project_id;

  insert into public.app_project_links
    (project_id, slug, label, kind, value, position, created_by, updated_by)
  values (
    target_project_id,
    null,
    new_label,
    'link',
    coalesce(new_value, ''),
    greatest(next_position, 100),
    (select auth.uid()),
    (select auth.uid())
  )
  returning id into new_id;

  perform private.record_link_event(
    new_id,
    'create',
    jsonb_build_object(
      'project_id', target_project_id,
      'label', btrim(new_label),
      'detail', format('Added custom link %L', btrim(new_label))
    )
  );

  return new_id;
end;
$$;

create or replace function public.app_delete_project_link(target_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_label text;
  row_project uuid;
  row_slug text;
begin
  select link.label, link.project_id, link.slug
    into row_label, row_project, row_slug
  from public.app_project_links link
  where link.id = target_link_id;

  if row_label is null then
    raise exception 'That link no longer exists.' using errcode = 'P0001';
  end if;

  if not (select private.can_manage_project(row_project)) then
    raise exception 'Only an owner or the project lead can remove working links.'
      using errcode = '42501';
  end if;

  if row_slug is not null then
    raise exception 'That is a standard link. Clear its value instead of removing the row.'
      using errcode = 'P0001';
  end if;

  perform private.record_link_event(
    target_link_id,
    'delete',
    jsonb_build_object(
      'project_id', row_project,
      'label', row_label,
      'detail', format('Removed custom link %L', row_label)
    )
  );

  delete from public.app_project_links link
  where link.id = target_link_id;
end;
$$;

revoke all on function public.app_set_project_link(uuid, text) from public, anon;
revoke all on function public.app_rename_project_link(uuid, text) from public, anon;
revoke all on function public.app_clear_project_link(uuid) from public, anon;
revoke all on function public.app_add_project_link(uuid, text, text) from public, anon;
revoke all on function public.app_delete_project_link(uuid) from public, anon;

grant execute on function public.app_set_project_link(uuid, text) to authenticated;
grant execute on function public.app_rename_project_link(uuid, text) to authenticated;
grant execute on function public.app_clear_project_link(uuid) to authenticated;
grant execute on function public.app_add_project_link(uuid, text, text) to authenticated;
grant execute on function public.app_delete_project_link(uuid) to authenticated;
