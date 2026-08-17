-- Chunk 10, low-volume project notifications.
--
-- A scheduled job has no signed-in user, and the service key deliberately has
-- no read privilege on any internal table — Chunk 1 revoked it and that is
-- worth keeping. So the sender gets exactly one function: an aggregate of what
-- is due, what has slipped, and who to tell. Nothing else, and never a
-- credential.

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
           client.name as client_name,
           lead.full_name as lead_name
    from public.app_projects project
    join public.app_clients client on client.id = project.client_id
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
