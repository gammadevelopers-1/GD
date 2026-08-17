-- Splits board authorship from board progress.
--
--   Content  — create, edit, organise, delete, attach, reorder, carry over.
--              Project owner and project lead only.
--   Status   — check, uncheck, start, block, complete, mark not completed.
--              Owner, lead, and any member assigned to the project.
--
-- This restores the line the original permission contract drew: a member moves
-- work along without being able to rewrite the plan. What changed since Chunk 6
-- is only that the lead now authors alongside the owner.

create or replace function private.can_update_card_status(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_manage_project(target_project_id))
    or exists (
      select 1
      from public.app_projects project
      where project.id = target_project_id
        and project.archived_at is null
        and (select private.is_project_member(target_project_id))
    )
$$;

comment on function private.can_update_card_status(uuid)
is 'Owner, project lead, or an assigned member. Progress only — never board content.';

revoke execute on function private.can_update_card_status(uuid) from public, anon;
grant execute on function private.can_update_card_status(uuid) to authenticated;

-- Readable from the application so the UI offers exactly what will be allowed.
create or replace function public.app_can_update_card_status(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_update_card_status(target_project_id))
$$;

revoke all on function public.app_can_update_card_status(uuid) from public, anon;
grant execute on function public.app_can_update_card_status(uuid) to authenticated;

-- Only the status function widens. Reorder and carry stay with the authors,
-- because both change the plan rather than report on it.
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
    or not (select private.can_update_card_status(owning_project)) then
    raise exception 'That milestone card is unavailable.' using errcode = '42501';
  end if;

  next_board := case when next_status = 'idea' then 'idea' else 'work' end;

  if next_status = 'blocked' and (reason is null or btrim(reason) = '') then
    raise exception 'A blocked card needs a blocker.' using errcode = '23514';
  end if;

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

comment on function public.app_set_milestone_card_status(uuid, text, text)
is 'Moves a card between boards and states. Owner, project lead or assigned member. Board content stays with the authors.';
