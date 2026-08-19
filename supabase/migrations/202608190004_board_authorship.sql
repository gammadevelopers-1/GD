-- Both week boards should be able to say who touched them last.
--
-- The idea board already records updated_by, because every write goes through
-- one RPC. Work-board tasks are written from several paths -- a direct update,
-- the status RPC, the AI accept step -- so a trigger is the only place that
-- catches all of them.

alter table public.app_milestone_cards
  add column if not exists updated_by uuid
    references public.app_profiles(id) on delete restrict;

create or replace function private.set_updated_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

drop trigger if exists app_milestone_cards_updated_by on public.app_milestone_cards;

create trigger app_milestone_cards_updated_by
  before insert or update on public.app_milestone_cards
  for each row execute function private.set_updated_by();

comment on column public.app_milestone_cards.updated_by
is 'Whoever last wrote this row, set by trigger so every write path records it.';

-- Carrying a task into the next week closes it here and says so in its title.
-- Doing it in one function keeps the title marker and the completed state from
-- ever disagreeing.
create or replace function public.app_carry_task_forward(
  target_card_id uuid,
  marker text default ' (moved to next week)'
)
returns public.app_milestone_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  updated public.app_milestone_cards;
begin
  target_project_id := (select private.milestone_card_project(target_card_id));

  if target_project_id is null then
    raise exception 'That task could not be found';
  end if;

  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Only an owner or the project lead can carry work forward';
  end if;

  update public.app_milestone_cards
     set title = case
           when position(marker in title) > 0 then title
           else left(title || marker, 240)
         end,
         status = 'completed',
         completed_at = coalesce(completed_at, now()),
         carry_reason = coalesce(carry_reason, 'Carried into the following week')
   where id = target_card_id
     and archived_at is null
  returning * into updated;

  if not found then
    raise exception 'That task could not be updated';
  end if;

  return updated;
end;
$$;

revoke all on function public.app_carry_task_forward(uuid, text) from public, anon;
grant execute on function public.app_carry_task_forward(uuid, text) to authenticated;
