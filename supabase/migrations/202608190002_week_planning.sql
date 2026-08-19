-- Weekly planning gives each milestone week a stated focus and a completion
-- state, so a project reads as a run of weeks rather than a pile of cards.
--
-- Planning a week (creating, renumbering, redating, archiving) stays exactly as
-- it was: owner only, through the existing table policies. Recording that a
-- week is finished, and saying what it is for, are progress-tracking actions,
-- so they follow can_manage_project -- owner anywhere, or the lead on their own
-- project. Neither touches money, members or credentials.

alter table public.app_milestone_weeks
  add column if not exists focus text
    check (focus is null or char_length(focus) <= 240),
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid
    references public.app_profiles(id) on delete restrict;

comment on column public.app_milestone_weeks.focus
is 'One line saying what this week is for. Written by an owner or the project lead.';

comment on column public.app_milestone_weeks.completed_at
is 'Set when someone marks the week finished. Cleared when they reopen it.';

create or replace function private.milestone_week_project(target_week_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select project_id from public.app_milestone_weeks where id = target_week_id
$$;

revoke execute on function private.milestone_week_project(uuid) from public, anon;
grant execute on function private.milestone_week_project(uuid) to authenticated;

create or replace function public.app_set_milestone_week_complete(
  target_week_id uuid,
  complete boolean
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  finished_at timestamptz;
begin
  target_project_id := (select private.milestone_week_project(target_week_id));

  if target_project_id is null then
    raise exception 'That week could not be found';
  end if;

  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Only an owner or the project lead can close a week';
  end if;

  update public.app_milestone_weeks
     set completed_at = case when complete then now() end,
         completed_by = case when complete then (select auth.uid()) end
   where id = target_week_id
     and archived_at is null
  returning completed_at into finished_at;

  if not found then
    raise exception 'That week could not be updated';
  end if;

  return finished_at;
end;
$$;

revoke all on function public.app_set_milestone_week_complete(uuid, boolean) from public, anon;
grant execute on function public.app_set_milestone_week_complete(uuid, boolean) to authenticated;

create or replace function public.app_set_milestone_week_focus(
  target_week_id uuid,
  new_focus text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  trimmed text;
  saved text;
begin
  target_project_id := (select private.milestone_week_project(target_week_id));

  if target_project_id is null then
    raise exception 'That week could not be found';
  end if;

  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Only an owner or the project lead can set a week''s focus';
  end if;

  trimmed := nullif(btrim(coalesce(new_focus, '')), '');

  if trimmed is not null and char_length(trimmed) > 240 then
    raise exception 'Keep the focus under 240 characters';
  end if;

  update public.app_milestone_weeks
     set focus = trimmed
   where id = target_week_id
     and archived_at is null
  returning focus into saved;

  if not found then
    raise exception 'That week could not be updated';
  end if;

  return saved;
end;
$$;

revoke all on function public.app_set_milestone_week_focus(uuid, text) from public, anon;
grant execute on function public.app_set_milestone_week_focus(uuid, text) to authenticated;

-- The weekly plan is now fetched on its own rather than nested inside the
-- project query, so it filters by project and orders by week number.
create index if not exists app_milestone_weeks_project_number_idx
  on public.app_milestone_weeks (project_id, week_number);
