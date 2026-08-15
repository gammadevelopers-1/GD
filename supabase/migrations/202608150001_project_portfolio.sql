-- Chunk 2. The portfolio needs milestone progress for every project, so we
-- add it up in one query 
create or replace function private.can_use_projects()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_app_role()) in ('owner', 'member'),
    false
  )
$$;

comment on function private.can_use_projects()
is 'True only for an active Owner or Member. Finance and inactive accounts are excluded from the Projects workspace.';

-- Security definer, so it checks access itself: owners get everything,
-- members only what they are assigned to. There is no value column at all.
create or replace function public.app_project_portfolio(
  search_text text default null,
  filter_statuses public.app_project_status[] default null,
  filter_client_id uuid default null,
  filter_person_id uuid default null,
  include_archived boolean default false
)
returns table (
  id uuid,
  name text,
  status public.app_project_status,
  client_id uuid,
  client_name text,
  lead_id uuid,
  lead_name text,
  starts_on date,
  due_on date,
  is_archived boolean,
  member_count integer,
  total_items integer,
  done_items integer,
  overdue_items integer,
  current_week_number integer,
  current_week_due_on date,
  current_week_total integer,
  current_week_done integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible as (
    select project.*
    from public.app_projects project
    where (select private.can_use_projects())
      and (
        (select private.is_owner())
        or (select private.is_project_member(project.id))
      )
      and (
        project.archived_at is null
        or (include_archived and (select private.is_owner()))
      )
  ),
  week_rollup as (
    select
      week.project_id as project_id,
      week.week_number as week_number,
      week.starts_on as week_starts_on,
      week.due_on as week_due_on,
      count(item.id)::integer as week_total,
      count(item.id) filter (where item.is_done)::integer as week_done
    from public.app_milestone_weeks week
    left join public.app_milestone_items item
      on item.milestone_week_id = week.id
      and item.archived_at is null
    where week.archived_at is null
      and week.project_id in (select visible.id from visible)
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
      ranked.week_due_on as week_due_on,
      ranked.week_total as week_total,
      ranked.week_done as week_done
    from ranked_weeks ranked
    order by
      ranked.project_id,
      ranked.bucket,
      case when ranked.bucket = 2 then -ranked.week_number else ranked.week_number end
  ),
  member_rollup as (
    select
      member.project_id as project_id,
      count(*)::integer as member_count
    from public.app_project_members member
    join public.app_profiles profile on profile.id = member.profile_id
    where member.archived_at is null
      and profile.is_active = true
      and profile.archived_at is null
      and member.project_id in (select visible.id from visible)
    group by member.project_id
  )
  select
    project.id,
    project.name,
    project.status,
    project.client_id,
    client.name as client_name,
    project.lead_id,
    lead.full_name as lead_name,
    project.starts_on,
    project.due_on,
    (project.archived_at is not null) as is_archived,
    coalesce(members.member_count, 0) as member_count,
    coalesce(totals.total_items, 0) as total_items,
    coalesce(totals.done_items, 0) as done_items,
    coalesce(totals.overdue_items, 0) as overdue_items,
    week_now.week_number as current_week_number,
    week_now.week_due_on as current_week_due_on,
    week_now.week_total as current_week_total,
    week_now.week_done as current_week_done
  from visible project
  join public.app_clients client on client.id = project.client_id
  left join public.app_profiles lead on lead.id = project.lead_id
  left join project_rollup totals on totals.project_id = project.id
  left join current_week week_now on week_now.project_id = project.id
  left join member_rollup members on members.project_id = project.id
  where (
      search_text is null
      or btrim(search_text) = ''
      or position(lower(btrim(search_text)) in lower(project.name)) > 0
      or position(lower(btrim(search_text)) in lower(client.name)) > 0
    )
    and (filter_statuses is null or project.status = any (filter_statuses))
    and (filter_client_id is null or project.client_id = filter_client_id)
    and (
      filter_person_id is null
      or project.lead_id = filter_person_id
      or exists (
        select 1
        from public.app_project_members member
        where member.project_id = project.id
          and member.profile_id = filter_person_id
          and member.archived_at is null
      )
    )
  order by
    (project.archived_at is not null),
    case project.status
      when 'paused' then 2
      when 'closed' then 3
      else 1
    end,
    project.due_on nulls last,
    project.name
$$;

comment on function public.app_project_portfolio(text, public.app_project_status[], uuid, uuid, boolean)
is 'Portfolio read for the Projects screen. Owners receive every project, Members only active assignments. Project value is never returned.';

-- Filter dropdowns only list clients and people you can already see.
create or replace function public.app_portfolio_clients()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct client.id, client.name
  from public.app_clients client
  join public.app_projects project on project.client_id = client.id
  where (select private.can_use_projects())
    and project.archived_at is null
    and (
      (select private.is_owner())
      or (select private.is_project_member(project.id))
    )
  order by client.name
$$;

create or replace function public.app_portfolio_people()
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct profile.id, profile.full_name
  from public.app_profiles profile
  where (select private.can_use_projects())
    and profile.is_active = true
    and profile.archived_at is null
    and exists (
      select 1
      from public.app_projects project
      where project.archived_at is null
        and (
          (select private.is_owner())
          or (select private.is_project_member(project.id))
        )
        and (
          project.lead_id = profile.id
          or exists (
            select 1
            from public.app_project_members member
            where member.project_id = project.id
              and member.profile_id = profile.id
              and member.archived_at is null
          )
        )
    )
  order by profile.full_name
$$;

comment on function public.app_portfolio_clients()
is 'Client filter options limited to clients the caller can already reach through the portfolio.';

comment on function public.app_portfolio_people()
is 'Person filter options limited to leads and assignees on projects the caller can already reach.';

revoke all on function public.app_project_portfolio(text, public.app_project_status[], uuid, uuid, boolean) from public;
revoke all on function public.app_project_portfolio(text, public.app_project_status[], uuid, uuid, boolean) from anon;
revoke all on function public.app_portfolio_clients() from public;
revoke all on function public.app_portfolio_clients() from anon;
revoke all on function public.app_portfolio_people() from public;
revoke all on function public.app_portfolio_people() from anon;
revoke all on function private.can_use_projects() from public;

grant execute on function public.app_project_portfolio(text, public.app_project_status[], uuid, uuid, boolean) to authenticated;
grant execute on function public.app_portfolio_clients() to authenticated;
grant execute on function public.app_portfolio_people() to authenticated;
grant execute on function private.can_use_projects() to authenticated;
