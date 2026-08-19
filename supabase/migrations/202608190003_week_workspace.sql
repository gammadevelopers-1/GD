-- The Milestone tab is rebuilt around the week: each week owns a rich-text
-- Idea Board and a Work Board checklist.
--
--   Idea Board — one document per week. Same shape and same guards as the
--                project-level board it replaces, so the editor, the parser and
--                the secret check are all reused unchanged.
--   Work Board — the existing app_milestone_cards on board 'work', now able to
--                carry an assignee and a rich body of their own.

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

create or replace function private.can_use_week_board(target_week_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_use_idea_board(
    (select private.milestone_week_project(target_week_id))
  ))
$$;

comment on function private.can_use_week_board(uuid)
is 'Owner anywhere, the project lead, or an assigned member — resolved through the week''s project.';

revoke execute on function private.can_use_week_board(uuid) from public, anon;
grant execute on function private.can_use_week_board(uuid) to authenticated;

create table if not exists public.app_week_idea_boards (
  milestone_week_id uuid primary key
    references public.app_milestone_weeks(id) on delete restrict,
  doc jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  updated_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_week_idea_boards enable row level security;

create policy "week_idea_boards_select" on public.app_week_idea_boards
  for select to authenticated
  using ((select private.can_use_week_board(milestone_week_id)));

revoke all on table public.app_week_idea_boards from anon;
grant select on table public.app_week_idea_boards to authenticated;

create trigger app_week_idea_boards_updated
  before update on public.app_week_idea_boards
  for each row execute function private.set_updated_at();

create function public.app_save_week_idea_board(
  target_week_id uuid,
  new_doc jsonb
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_at timestamptz;
begin
  if not (select private.can_use_week_board(target_week_id)) then
    raise exception 'You cannot edit this week''s idea board';
  end if;

  if exists (
    select 1
    from public.app_milestone_weeks week
    join public.app_projects project on project.id = week.project_id
    where week.id = target_week_id
      and (week.archived_at is not null or project.archived_at is not null)
  ) then
    raise exception 'This week is archived';
  end if;

  if jsonb_typeof(new_doc) is distinct from 'object'
     or new_doc ->> 'type' is distinct from 'doc' then
    raise exception 'That is not a document';
  end if;

  if pg_column_size(new_doc) > 2000000 then
    raise exception 'This board is too large to save';
  end if;

  insert into public.app_week_idea_boards (milestone_week_id, doc, updated_by)
  values (target_week_id, new_doc, (select auth.uid()))
  on conflict (milestone_week_id) do update
    set doc = excluded.doc,
        updated_by = excluded.updated_by
  returning updated_at into saved_at;

  return saved_at;
end;
$$;

revoke all on function public.app_save_week_idea_board(uuid, jsonb) from public, anon;
grant execute on function public.app_save_week_idea_board(uuid, jsonb) to authenticated;

-- A work-board task can name who is doing it and hold a rich body. `doc` is a
-- TipTap document so the task editor is the same editor as the idea board;
-- the older `blocks` column stays untouched for anything already written.
alter table public.app_milestone_cards
  add column if not exists assigned_to uuid
    references public.app_profiles(id) on delete restrict,
  add column if not exists doc jsonb;

create index if not exists app_milestone_cards_assigned_idx
  on public.app_milestone_cards (assigned_to)
  where assigned_to is not null;

-- Same rule the milestone items already follow: you can only hand work to
-- somebody actually on the project.
create or replace function private.assert_card_assignee_on_team()
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

  target_project_id := (select private.milestone_week_project(new.milestone_week_id));

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
    raise exception 'A task can only be assigned to someone on the project team.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists app_milestone_cards_assignee on public.app_milestone_cards;

create trigger app_milestone_cards_assignee
  before insert or update on public.app_milestone_cards
  for each row execute function private.assert_card_assignee_on_team();

-- Dismissing a carry-over suggestion has to stick, or it returns on every load.
create table if not exists public.app_card_carry_dismissals (
  card_id uuid not null references public.app_milestone_cards(id) on delete restrict,
  milestone_week_id uuid not null references public.app_milestone_weeks(id) on delete restrict,
  dismissed_by uuid references public.app_profiles(id) on delete restrict,
  dismissed_at timestamptz not null default now(),
  primary key (card_id, milestone_week_id)
);

alter table public.app_card_carry_dismissals enable row level security;

create policy "carry_dismissals_select" on public.app_card_carry_dismissals
  for select to authenticated
  using ((select private.can_use_week_board(milestone_week_id)));

create policy "carry_dismissals_insert" on public.app_card_carry_dismissals
  for insert to authenticated
  with check ((select private.can_use_week_board(milestone_week_id)));

create policy "carry_dismissals_delete" on public.app_card_carry_dismissals
  for delete to authenticated
  using ((select private.can_use_week_board(milestone_week_id)));

revoke all on table public.app_card_carry_dismissals from anon;
grant select, insert, delete on table public.app_card_carry_dismissals to authenticated;
