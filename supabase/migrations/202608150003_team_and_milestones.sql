--milestone and team management
alter table public.app_project_members
  add column if not exists archived_by uuid references public.app_profiles(id) on delete restrict;

comment on column public.app_project_members.archived_by
is 'Who removed this person from the project. added_by records who put them on it.';

-- Keeps deactivated people off project teams, whatever writes the row.
create or replace function private.assert_assignable_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and new.profile_id is not distinct from old.profile_id
    and not (old.archived_at is not null and new.archived_at is null) then
    return new;
  end if;

  if new.archived_at is not null then
    return new;
  end if;

  if not exists (
    select 1
    from public.app_profiles profile
    where profile.id = new.profile_id
      and profile.is_active = true
      and profile.archived_at is null
  ) then
    raise exception 'Only an active team member can be assigned to a project.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger app_project_members_assignable
  before insert or update on public.app_project_members
  for each row execute function private.assert_assignable_profile();

comment on function private.assert_assignable_profile()
is 'Keeps deactivated and archived people off project teams, whatever writes the assignment.';

-- Only live weeks need a unique number, so archiving Week 3 frees it again.
alter table public.app_milestone_weeks
  drop constraint if exists app_milestone_weeks_project_id_week_number_key;

create unique index if not exists app_milestone_weeks_live_number_idx
  on public.app_milestone_weeks (project_id, week_number)
  where archived_at is null;

-- An item can only go to someone on the team. Checked when the assignee
-- changes, so removing a person does not freeze their unfinished items.
create or replace function private.assert_item_assignee_on_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  if new.assigned_to is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  select week.project_id
  into target_project_id
  from public.app_milestone_weeks week
  where week.id = new.milestone_week_id;

  if not exists (
    select 1
    from public.app_project_members member
    join public.app_profiles profile on profile.id = member.profile_id
    where member.project_id = target_project_id
      and member.profile_id = new.assigned_to
      and member.archived_at is null
      and profile.is_active = true
      and profile.archived_at is null
  ) then
    raise exception 'A milestone item can only be assigned to someone on the project team.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger app_milestone_items_assignee
  before insert or update on public.app_milestone_items
  for each row execute function private.assert_item_assignee_on_team();

-- Owner-only editing, since the table itself is closed to everyone.
create or replace function private.owner_editable_item_project(target_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  if not (select private.is_owner()) then
    raise exception 'Only an owner can plan milestone work.' using errcode = '42501';
  end if;

  select project.id
  into target_project_id
  from public.app_milestone_items item
  join public.app_milestone_weeks week on week.id = item.milestone_week_id
  join public.app_projects project on project.id = week.project_id
  where item.id = target_item_id
    and project.archived_at is null;

  if target_project_id is null then
    raise exception 'That milestone item is unavailable.' using errcode = '42501';
  end if;

  return target_project_id;
end;
$$;

create or replace function public.app_save_milestone_item(
  target_item_id uuid,
  new_label text,
  new_assigned_to uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.owner_editable_item_project(target_item_id);

  if new_label is null or btrim(new_label) = '' then
    raise exception 'A milestone item needs a description.' using errcode = '22023';
  end if;
  if char_length(btrim(new_label)) > 240 then
    raise exception 'Keep a milestone item under 240 characters.' using errcode = '22023';
  end if;

  update public.app_milestone_items item
  set label = btrim(new_label),
      assigned_to = new_assigned_to
  where item.id = target_item_id;
end;
$$;

create or replace function public.app_set_milestone_item_archived(
  target_item_id uuid,
  archived boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.owner_editable_item_project(target_item_id);

  update public.app_milestone_items item
  set archived_at = case when archived then now() else null end
  where item.id = target_item_id;
end;
$$;

comment on function public.app_save_milestone_item(uuid, text, uuid)
is 'Owner-only edit of a milestone item label and assignee. Members can still only change done/not-done.';
comment on function public.app_set_milestone_item_archived(uuid, boolean)
is 'Owner-only archive and restore of a milestone item. Items are never deleted.';

revoke all on function private.owner_editable_item_project(uuid) from public;
revoke all on function public.app_save_milestone_item(uuid, text, uuid) from public;
revoke all on function public.app_save_milestone_item(uuid, text, uuid) from anon;
revoke all on function public.app_set_milestone_item_archived(uuid, boolean) from public;
revoke all on function public.app_set_milestone_item_archived(uuid, boolean) from anon;

grant execute on function public.app_save_milestone_item(uuid, text, uuid) to authenticated;
grant execute on function public.app_set_milestone_item_archived(uuid, boolean) to authenticated;

-- Owners need to read archived assignments to restore them.
drop policy if exists "project_members_select_allowed" on public.app_project_members;
create policy "project_members_select_allowed"
on public.app_project_members
for select
to authenticated
using (
  (select private.is_owner())
  or (archived_at is null and (select private.is_project_member(project_id)))
);

create index if not exists app_project_members_archived_idx
  on public.app_project_members (project_id)
  where archived_at is not null;
