-- Milestones become two boards per week.
--
--   Idea Board  — rich blocks. What we are thinking of doing this week.
--   Work Board  — what actually happened, in sequence: in progress, blocked,
--                 completed, and incomplete at the bottom.
--
-- This replaces the one-line app_milestone_items model rather than sitting
-- beside it. The old table stays as history with its write paths revoked, so
-- nothing is deleted and there is still only one live system.
--
-- Two deliberate departures from the earlier chunks, both requested:
--   * No assignee. The board records what was done, not who did it.
--   * The project lead can edit their own project's boards. Until now lead was
--     a responsibility that granted nothing; here it grants authorship.

-- ---------------------------------------------------------------------------
-- Who may edit a board
-- ---------------------------------------------------------------------------

create or replace function private.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_owner())
    or exists (
      select 1
      from public.app_projects project
      join public.app_profiles profile on profile.id = project.lead_id
      where project.id = target_project_id
        and project.archived_at is null
        and project.lead_id = (select auth.uid())
        and profile.is_active = true
        and profile.archived_at is null
    )
$$;

comment on function private.can_manage_project(uuid)
is 'Owner anywhere, or the active project lead on their own project. Board authorship only — it grants nothing over money, members or credentials.';

revoke execute on function private.can_manage_project(uuid) from public, anon;
grant execute on function private.can_manage_project(uuid) to authenticated;

-- Same question, reachable from the application so the UI can match the rules.
create or replace function public.app_can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_manage_project(target_project_id))
$$;

revoke all on function public.app_can_manage_project(uuid) from public, anon;
grant execute on function public.app_can_manage_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The card
-- ---------------------------------------------------------------------------

create table if not exists public.app_milestone_cards (
  id uuid primary key default gen_random_uuid(),
  milestone_week_id uuid not null
    references public.app_milestone_weeks(id) on delete restrict,

  -- Which board it currently sits on.
  board text not null check (board in ('idea', 'work')),

  -- Idea cards are always 'idea'. Work cards carry the real state.
  status text not null check (
    status in ('idea', 'in_progress', 'blocked', 'completed', 'incomplete')
  ),

  title text not null check (char_length(title) between 1 and 240),

  -- Rich content as an ordered block list. Shape is owned by the application
  -- (lib/projects/blocks.ts) and validated there before it ever arrives here.
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),

  -- Sequence within its board. Kept dense by the reorder function.
  position integer not null default 0,

  -- Why it is stuck. Preserved even after the card is unblocked, so the
  -- history of what got in the way survives.
  blocker_reason text check (blocker_reason is null or char_length(blocker_reason) <= 2000),

  -- Why it did not get finished. Travels with the card into the next week.
  carry_reason text check (carry_reason is null or char_length(carry_reason) <= 2000),
  carried_from_week_id uuid references public.app_milestone_weeks(id) on delete restrict,

  completed_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A board and its statuses have to agree.
  constraint app_milestone_cards_board_status check (
    (board = 'idea' and status = 'idea')
    or (board = 'work' and status in ('in_progress', 'blocked', 'completed', 'incomplete'))
  ),
  -- Blocked without a stated blocker is the thing this board exists to prevent.
  constraint app_milestone_cards_blocked_reason check (
    status <> 'blocked' or (blocker_reason is not null and btrim(blocker_reason) <> '')
  ),
  -- Completion timestamp tracks the status, in both directions.
  constraint app_milestone_cards_completed_at check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists app_milestone_cards_week_board_idx
  on public.app_milestone_cards (milestone_week_id, board, position)
  where archived_at is null;

create index if not exists app_milestone_cards_status_idx
  on public.app_milestone_cards (status)
  where archived_at is null;

create trigger app_milestone_cards_updated
  before update on public.app_milestone_cards
  for each row execute function private.set_updated_at();

comment on table public.app_milestone_cards
is 'Idea Board and Work Board cards for a milestone week. No assignee by design: the board records what was done, not who did it.';

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.app_milestone_cards enable row level security;

-- Reading follows project access exactly as milestones always have.
create policy "milestone_cards_select_allowed"
on public.app_milestone_cards
for select
to authenticated
using (
  exists (
    select 1
    from public.app_milestone_weeks week
    where week.id = milestone_week_id
      and (select private.can_work_on_project(week.project_id))
  )
);

create policy "milestone_cards_manager_insert"
on public.app_milestone_cards
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_milestone_weeks week
    join public.app_projects project on project.id = week.project_id
    where week.id = milestone_week_id
      and week.archived_at is null
      and project.archived_at is null
      and (select private.can_manage_project(week.project_id))
  )
);

create policy "milestone_cards_manager_update"
on public.app_milestone_cards
for update
to authenticated
using (
  exists (
    select 1
    from public.app_milestone_weeks week
    where week.id = milestone_week_id
      and (select private.can_manage_project(week.project_id))
  )
)
with check (
  exists (
    select 1
    from public.app_milestone_weeks week
    where week.id = milestone_week_id
      and (select private.can_manage_project(week.project_id))
  )
);

revoke all on public.app_milestone_cards from public, anon;
grant select, insert, update on public.app_milestone_cards to authenticated;

-- ---------------------------------------------------------------------------
-- Movement between boards, as functions so a move is one atomic step
-- ---------------------------------------------------------------------------

create or replace function private.milestone_card_project(target_card_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select week.project_id
  from public.app_milestone_cards card
  join public.app_milestone_weeks week on week.id = card.milestone_week_id
  where card.id = target_card_id
$$;

-- Moves a card to a board/status, keeping the reasons and the sequence right.
create or replace function public.app_set_milestone_card_status(
  target_card_id uuid,
  next_status text,
  reason text default null
)
returns public.app_milestone_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  owning_project uuid;
  next_board text;
  next_position integer;
  updated public.app_milestone_cards;
begin
  if next_status not in ('idea', 'in_progress', 'blocked', 'completed', 'incomplete') then
    raise exception 'Unknown card status.' using errcode = '22023';
  end if;

  owning_project := private.milestone_card_project(target_card_id);
  if owning_project is null
    or not (select private.can_manage_project(owning_project)) then
    raise exception 'That milestone card is unavailable.' using errcode = '42501';
  end if;

  next_board := case when next_status = 'idea' then 'idea' else 'work' end;

  if next_status = 'blocked' and (reason is null or btrim(reason) = '') then
    raise exception 'A blocked card needs a blocker.' using errcode = '23514';
  end if;

  -- Land at the end of the destination board so sequence stays meaningful.
  select coalesce(max(card.position), -1) + 1
  into next_position
  from public.app_milestone_cards card
  where card.milestone_week_id = (
      select milestone_week_id from public.app_milestone_cards where id = target_card_id
    )
    and card.board = next_board
    and card.archived_at is null
    and card.id <> target_card_id;

  update public.app_milestone_cards card
  set
    board = next_board,
    status = next_status,
    position = next_position,
    completed_at = case when next_status = 'completed' then now() else null end,
    -- Reasons are preserved rather than cleared: an unblocked card should
    -- still be able to say what had blocked it.
    blocker_reason = case
      when next_status = 'blocked' then btrim(reason)
      else card.blocker_reason
    end,
    carry_reason = case
      when next_status = 'incomplete' and reason is not null and btrim(reason) <> ''
        then btrim(reason)
      else card.carry_reason
    end
  where card.id = target_card_id
  returning card.* into updated;

  return updated;
end;
$$;

revoke all on function public.app_set_milestone_card_status(uuid, text, text) from public, anon;
grant execute on function public.app_set_milestone_card_status(uuid, text, text) to authenticated;

-- Rewrites the sequence of one board in one statement.
create or replace function public.app_reorder_milestone_cards(
  target_week_id uuid,
  target_board text,
  ordered_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  owning_project uuid;
  moved integer;
begin
  select week.project_id into owning_project
  from public.app_milestone_weeks week
  where week.id = target_week_id;

  if owning_project is null
    or not (select private.can_manage_project(owning_project)) then
    raise exception 'That milestone week is unavailable.' using errcode = '42501';
  end if;

  if target_board not in ('idea', 'work') then
    raise exception 'Unknown board.' using errcode = '22023';
  end if;

  update public.app_milestone_cards card
  set position = ordering.index - 1
  from unnest(ordered_ids) with ordinality as ordering(card_id, index)
  where card.id = ordering.card_id
    and card.milestone_week_id = target_week_id
    and card.board = target_board;

  get diagnostics moved = row_count;
  return moved;
end;
$$;

revoke all on function public.app_reorder_milestone_cards(uuid, text, uuid[]) from public, anon;
grant execute on function public.app_reorder_milestone_cards(uuid, text, uuid[]) to authenticated;

-- Carries an unfinished card into another week, keeping why it slipped.
create or replace function public.app_carry_milestone_card(
  target_card_id uuid,
  target_week_id uuid,
  reason text default null
)
returns public.app_milestone_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_project uuid;
  to_project uuid;
  from_week uuid;
  next_position integer;
  updated public.app_milestone_cards;
begin
  from_project := private.milestone_card_project(target_card_id);

  select week.project_id into to_project
  from public.app_milestone_weeks week
  where week.id = target_week_id and week.archived_at is null;

  if from_project is null or to_project is null or from_project <> to_project then
    raise exception 'A card can only move within its own project.' using errcode = '42501';
  end if;
  if not (select private.can_manage_project(from_project)) then
    raise exception 'That milestone card is unavailable.' using errcode = '42501';
  end if;

  select card.milestone_week_id into from_week
  from public.app_milestone_cards card where card.id = target_card_id;

  if from_week = target_week_id then
    raise exception 'That card is already in this week.' using errcode = '22023';
  end if;

  select coalesce(max(card.position), -1) + 1
  into next_position
  from public.app_milestone_cards card
  where card.milestone_week_id = target_week_id
    and card.board = 'idea'
    and card.archived_at is null;

  -- It arrives back on the Idea Board of the new week, still carrying the
  -- reason it did not get finished and a pointer to where it came from.
  update public.app_milestone_cards card
  set
    milestone_week_id = target_week_id,
    board = 'idea',
    status = 'idea',
    position = next_position,
    completed_at = null,
    carried_from_week_id = from_week,
    carry_reason = case
      when reason is not null and btrim(reason) <> '' then btrim(reason)
      else card.carry_reason
    end
  where card.id = target_card_id
  returning card.* into updated;

  return updated;
end;
$$;

revoke all on function public.app_carry_milestone_card(uuid, uuid, text) from public, anon;
grant execute on function public.app_carry_milestone_card(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Migrate the existing items onto the boards
-- ---------------------------------------------------------------------------

insert into public.app_milestone_cards (
  milestone_week_id, board, status, title, blocks, position,
  completed_at, archived_at, created_by, created_at
)
select
  item.milestone_week_id,
  case when item.is_done then 'work' else 'idea' end as board,
  case when item.is_done then 'completed' else 'idea' end as status,
  item.label,
  '[]'::jsonb,
  (row_number() over (
     partition by item.milestone_week_id, item.is_done
     order by item.created_at, item.id
   ))::integer - 1,
  item.completed_at,
  item.archived_at,
  coalesce(
    item.completed_by,
    (select project.created_by
     from public.app_milestone_weeks week
     join public.app_projects project on project.id = week.project_id
     where week.id = item.milestone_week_id)
  ),
  item.created_at
from public.app_milestone_items item
where not exists (
  select 1 from public.app_milestone_cards existing
  where existing.milestone_week_id = item.milestone_week_id
    and existing.title = item.label
);

-- The old table becomes history. Nothing is dropped, but nothing writes here
-- any more, so there is only ever one live milestone system.
revoke insert, update on public.app_milestone_items from authenticated;

comment on table public.app_milestone_items
is 'Superseded by app_milestone_cards. Retained as history; no write path remains.';

-- ---------------------------------------------------------------------------
-- Attachments live in their own private bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('app-project-attachments', 'app-project-attachments', false, 10485760)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

-- Paths are project-scoped: <project_id>/<card_id>/<file>. Reading follows
-- project access, writing follows board authorship.
create policy "project_attachments_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'app-project-attachments'
    and (select private.can_work_on_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

create policy "project_attachments_manager_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'app-project-attachments'
    and (select private.can_manage_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

create policy "project_attachments_manager_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'app-project-attachments'
    and (select private.can_manage_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  )
  with check (
    bucket_id = 'app-project-attachments'
    and (select private.can_manage_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );
