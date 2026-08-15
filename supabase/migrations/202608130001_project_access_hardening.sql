create or replace function private.has_active_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_profiles profile
    where profile.id = (select auth.uid())
      and profile.is_active = true
      and profile.archived_at is null
  )
$$;

create or replace function private.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_project_members member
    join public.app_profiles profile on profile.id = member.profile_id
    join public.app_projects project on project.id = member.project_id
    where member.project_id = target_project_id
      and member.profile_id = (select auth.uid())
      and member.archived_at is null
      and profile.is_active = true
      and profile.archived_at is null
      and project.archived_at is null
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
    or (select private.is_project_member(target_project_id))
$$;

create or replace function private.can_work_on_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner())
    or (select private.is_project_member(target_project_id))
$$;

create or replace function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.has_active_account())
    and (
      (select private.is_owner())
      or target_profile_id = (select auth.uid())
      or exists (
        select 1
        from public.app_project_members mine
        join public.app_project_members theirs on theirs.project_id = mine.project_id
        join public.app_projects project on project.id = mine.project_id
        join public.app_profiles target_profile on target_profile.id = theirs.profile_id
        where mine.profile_id = (select auth.uid())
          and theirs.profile_id = target_profile_id
          and mine.archived_at is null
          and theirs.archived_at is null
          and project.archived_at is null
          and target_profile.is_active = true
          and target_profile.archived_at is null
      )
    )
$$;

create or replace function private.can_view_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.has_active_account())
    and (
      (select private.is_owner())
      or (select private.is_finance())
      or exists (
        select 1
        from public.app_projects project
        where project.client_id = target_client_id
          and project.archived_at is null
          and (select private.is_project_member(project.id))
      )
    )
$$;

drop policy if exists "profiles_select_allowed" on public.app_profiles;
create policy "profiles_select_allowed"
on public.app_profiles
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.can_view_profile(id)))
);

drop policy if exists "clients_select_allowed" on public.app_clients;
create policy "clients_select_allowed"
on public.app_clients
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.can_view_client(id)))
);

drop policy if exists "contacts_select_allowed" on public.app_client_contacts;
create policy "contacts_select_allowed"
on public.app_client_contacts
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.can_view_client(client_id)))
);

drop policy if exists "projects_select_allowed" on public.app_projects;
create policy "projects_select_allowed"
on public.app_projects
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.is_project_member(id)))
);

drop policy if exists "project_members_select_allowed" on public.app_project_members;
create policy "project_members_select_allowed"
on public.app_project_members
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.is_project_member(project_id)))
);

drop policy if exists "milestone_weeks_select_allowed" on public.app_milestone_weeks;
create policy "milestone_weeks_select_allowed"
on public.app_milestone_weeks
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.is_project_member(project_id)))
);

drop policy if exists "milestone_items_select_allowed" on public.app_milestone_items;
create policy "milestone_items_select_allowed"
on public.app_milestone_items
for select
to authenticated
using (
  (select private.is_owner())
  or (
    archived_at is null
    and exists (
      select 1
      from public.app_milestone_weeks week
      where week.id = milestone_week_id
        and week.archived_at is null
        and (select private.is_project_member(week.project_id))
    )
  )
);

drop policy if exists "employment_owner_or_self_select" on public.app_employment_private;
create policy "employment_owner_or_self_select"
on public.app_employment_private
for select
to authenticated
using (
  archived_at is null
  and (select private.has_active_account())
  and (
    (select private.is_owner())
    or (
      not (select private.is_finance())
      and profile_id = (select auth.uid())
    )
  )
);

drop policy if exists "documents_owner_or_self_select" on public.app_documents;
create policy "documents_owner_or_self_select"
on public.app_documents
for select
to authenticated
using (
  archived_at is null
  and (select private.has_active_account())
  and (
    (select private.is_owner())
    or (
      not (select private.is_finance())
      and profile_id = (select auth.uid())
    )
  )
);

drop policy if exists "private_documents_select" on storage.objects;
create policy "private_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'app-private-documents'
  and (select private.has_active_account())
  and exists (
    select 1
    from public.app_documents document
    where document.storage_path = name
      and document.archived_at is null
      and (
        (select private.is_owner())
        or (
          not (select private.is_finance())
          and document.profile_id = (select auth.uid())
        )
      )
  )
);

-- Members can tick items off, but never edit the label, assignee or dates.
drop policy if exists "milestone_items_project_insert" on public.app_milestone_items;
drop policy if exists "milestone_items_project_update" on public.app_milestone_items;

create policy "milestone_items_owner_insert"
on public.app_milestone_items
for insert
to authenticated
with check (
  (select private.is_owner())
  and exists (
    select 1
    from public.app_milestone_weeks week
    join public.app_projects project on project.id = week.project_id
    where week.id = milestone_week_id
      and week.archived_at is null
      and project.archived_at is null
  )
);

create policy "milestone_items_owner_update"
on public.app_milestone_items
for update
to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

revoke update on public.app_milestone_items from authenticated;

create or replace function public.app_toggle_milestone_item(target_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  next_is_done boolean;
begin
  select week.project_id
  into target_project_id
  from public.app_milestone_items item
  join public.app_milestone_weeks week on week.id = item.milestone_week_id
  join public.app_projects project on project.id = week.project_id
  where item.id = target_item_id
    and item.archived_at is null
    and week.archived_at is null
    and project.archived_at is null;

  if target_project_id is null
    or not (select private.can_work_on_project(target_project_id)) then
    raise exception 'Project milestone is unavailable.'
      using errcode = '42501';
  end if;

  update public.app_milestone_items item
  set
    is_done = not item.is_done,
    completed_at = case when not item.is_done then now() else null end,
    completed_by = case when not item.is_done then (select auth.uid()) else null end
  where item.id = target_item_id
  returning item.is_done into next_is_done;

  return next_is_done;
end;
$$;

revoke all on function public.app_toggle_milestone_item(uuid) from public;
revoke all on function public.app_toggle_milestone_item(uuid) from anon;
grant execute on function public.app_toggle_milestone_item(uuid) to authenticated;

revoke execute on function private.has_active_account() from public;
grant execute on function private.has_active_account() to authenticated;

-- New tables and functions start closed to anonymous users.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public;

comment on function public.app_toggle_milestone_item(uuid)
is 'Authorized completion-only mutation. It never permits members to edit milestone planning fields.';
