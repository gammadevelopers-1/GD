-- A project needs a name. Everything else can arrive later.
--
-- client_id has been required since the first migration, which meant the very
-- first project could not be created until a client record existed — and there
-- is no client authoring screen yet, so that meant opening Supabase. Delivery
-- work often starts before the client record is tidy, and a project nobody can
-- create is worse than a project with a blank client.
--
-- Two read paths joined app_clients inline. An inner join would have silently
-- dropped every client-less project out of the portfolio and out of milestone
-- reminders, so both become left joins here.

alter table public.app_projects
  alter column client_id drop not null;

comment on column public.app_projects.client_id
is 'Optional. A project can be created with a name alone and attached to a client later.';

-- Portfolio read: unchanged except the client join and a null-safe search.
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
  left join public.app_clients client on client.id = project.client_id
  left join public.app_profiles lead on lead.id = project.lead_id
  left join project_rollup totals on totals.project_id = project.id
  left join current_week week_now on week_now.project_id = project.id
  left join member_rollup members on members.project_id = project.id
  where (
      search_text is null
      or btrim(search_text) = ''
      or position(lower(btrim(search_text)) in lower(project.name)) > 0
      or position(lower(btrim(search_text)) in lower(coalesce(client.name, ''))) > 0
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
is 'Portfolio read for the Projects screen. Owners receive every project, Members only active assignments. Project value is never returned. Projects without a client are included.';

-- Notification digest: same change, so a client-less project still reminds.
create or replace function public.app_notification_digest(horizon_days integer default 3)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with live_projects as (
    select project.id,
           project.name,
           project.status,
           project.due_on,
           coalesce(client.name, 'No client') as client_name,
           lead.full_name as lead_name
    from public.app_projects project
    left join public.app_clients client on client.id = project.client_id
    left join public.app_profiles lead on lead.id = project.lead_id
    where project.archived_at is null
      and project.status not in ('closed', 'paused')
  ),
  open_items as (
    select item.id,
           item.label,
           item.assigned_to,
           week.due_on as week_due_on,
           week.week_number,
           live_projects.id as project_id,
           live_projects.name as project_name,
           case
             when week.due_on < current_date then 'overdue'
             else 'due'
           end as state
    from public.app_milestone_items item
    join public.app_milestone_weeks week on week.id = item.milestone_week_id
    join live_projects on live_projects.id = week.project_id
    where item.archived_at is null
      and item.is_done = false
      and week.archived_at is null
      and week.due_on <= current_date + greatest(coalesce(horizon_days, 3), 0)
  )
  select jsonb_build_object(
    'generated_on', current_date,
    'horizon_days', greatest(coalesce(horizon_days, 3), 0),
    'owners', coalesce((
      select jsonb_agg(jsonb_build_object('name', profile.full_name, 'email', account.email))
      from public.app_profiles profile
      join auth.users account on account.id = profile.id
      where profile.role = 'owner'
        and profile.is_active = true
        and profile.archived_at is null
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', live_projects.id,
        'name', live_projects.name,
        'client', live_projects.client_name,
        'status', live_projects.status,
        'lead', live_projects.lead_name,
        'due_on', live_projects.due_on,
        'due_items', (
          select count(*) from open_items
          where open_items.project_id = live_projects.id and open_items.state = 'due'
        ),
        'overdue_items', (
          select count(*) from open_items
          where open_items.project_id = live_projects.id and open_items.state = 'overdue'
        )
      ) order by live_projects.name)
      from live_projects
    ), '[]'::jsonb),
    'reminders', coalesce((
      select jsonb_agg(person)
      from (
        select jsonb_build_object(
          'profile_id', profile.id,
          'name', profile.full_name,
          'email', account.email,
          'items', jsonb_agg(jsonb_build_object(
            'project', open_items.project_name,
            'label', open_items.label,
            'week_number', open_items.week_number,
            'due_on', open_items.week_due_on,
            'state', open_items.state
          ) order by open_items.week_due_on)
        ) as person
        from open_items
        join public.app_profiles profile on profile.id = open_items.assigned_to
        join auth.users account on account.id = profile.id
        where profile.is_active = true
          and profile.archived_at is null
        group by profile.id, profile.full_name, account.email
      ) grouped
    ), '[]'::jsonb)
  )
$$;

comment on function public.app_notification_digest(integer)
is 'Chunk 10. What is due, what has slipped, and who to tell. Callable only by the scheduled sender — never by a signed-in user, and it carries no financial or credential data.';

revoke all on function public.app_notification_digest(integer) from public, anon, authenticated;
grant execute on function public.app_notification_digest(integer) to service_role;
