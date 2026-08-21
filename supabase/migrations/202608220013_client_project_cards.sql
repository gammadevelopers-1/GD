-- The client's project picker gets the same card as the owner's project list.
--
-- app_client_projects() returned a name and a status, so the picker could only
-- ever be a list of links. The owner's portfolio has shown banner, progress and
-- dates from the start, and there is no reason a client should see less about
-- their own project than they already see the moment they open it.
--
-- This is the client's only door to their project list, so what changes is the
-- column list and nothing else. Every condition that decides which rows come
-- back is carried over untouched: the grant must be unrevoked, the account
-- unarchived, the project unarchived, and the grant must belong to the caller.
-- The rollup is copied from app_project_portfolio so the two lists cannot drift
-- into disagreeing about what "done" means.
--
-- Nothing here reaches app_project_financials, app_project_credentials,
-- app_project_technical_details or any notes column. A client gains no field
-- they could not already read through client_portal_payload.

-- The return type changes, so the old signature has to go first.
drop function if exists public.app_client_projects();

create function public.app_client_projects()
returns table(
  public_id text,
  name text,
  status text,
  banner_path text,
  banner_fit text,
  starts_on date,
  due_on date,
  total_items integer,
  done_items integer,
  overdue_items integer,
  current_week_number integer,
  current_week_due_on date
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select project.*
    from public.app_project_client_access access
    join public.app_projects project on project.id = access.project_id
    join public.app_client_users account on account.id = access.client_user_id
    where access.client_user_id = (select auth.uid())
      and access.revoked_at is null
      and account.archived_at is null
      and project.archived_at is null
  ),
  week_rollup as (
    select
      week.project_id as project_id,
      week.week_number as week_number,
      week.starts_on as week_starts_on,
      week.due_on as week_due_on,
      count(card.id)::integer as week_total,
      count(card.id) filter (where card.status = 'completed')::integer as week_done
    from public.app_milestone_weeks week
    left join public.app_milestone_cards card
      on card.milestone_week_id = week.id
      and card.archived_at is null
    where week.archived_at is null
      and week.project_id in (select mine.id from mine)
    group by week.id, week.project_id, week.week_number, week.starts_on, week.due_on
  ),
  project_rollup as (
    select
      rollup.project_id as project_id,
      sum(rollup.week_total)::integer as total_items,
      sum(rollup.week_done)::integer as done_items,
      sum(
        case
          when rollup.week_due_on < current_date
          then rollup.week_total - rollup.week_done
          else 0
        end
      )::integer as overdue_items
    from week_rollup rollup
    group by rollup.project_id
  ),
  ranked_weeks as (
    select
      rollup.*,
      case
        when current_date
          between coalesce(rollup.week_starts_on, rollup.week_due_on)
          and rollup.week_due_on then 0
        when rollup.week_due_on >= current_date then 1
        else 2
      end as bucket
    from week_rollup rollup
  ),
  current_week as (
    select distinct on (ranked.project_id)
      ranked.project_id as project_id,
      ranked.week_number as week_number,
      ranked.week_due_on as week_due_on
    from ranked_weeks ranked
    order by
      ranked.project_id,
      ranked.bucket,
      case
        when ranked.bucket = 2 then -ranked.week_number
        else ranked.week_number
      end
  )
  select
    mine.public_id,
    mine.name,
    mine.status::text,
    mine.banner_path,
    mine.banner_fit,
    mine.starts_on,
    mine.due_on,
    coalesce(rollup.total_items, 0),
    coalesce(rollup.done_items, 0),
    coalesce(rollup.overdue_items, 0),
    week.week_number,
    week.week_due_on
  from mine
  left join project_rollup rollup on rollup.project_id = mine.id
  left join current_week week on week.project_id = mine.id
  order by mine.name
$$;

comment on function public.app_client_projects()
is 'Every project the calling client still has an unrevoked grant to, with the progress a card needs. Carries no financial, credential or technical column.';

revoke all on function public.app_client_projects() from public, anon;
grant execute on function public.app_client_projects() to authenticated;
