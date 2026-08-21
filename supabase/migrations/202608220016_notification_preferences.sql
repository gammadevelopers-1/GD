-- Honouring the two switches on the Settings page.
--
-- app_notification_digest chooses its own recipients: every active owner for the
-- weekly summary, and whoever a milestone is assigned to for the reminders. The
-- Settings page now offers a person a say in both, and a switch that does not
-- reach the thing it names is decoration. So the preference is applied here,
-- where the list is built, rather than filtered afterwards in the route -- the
-- digest should not hand out an address it was told not to use.
--
-- Everything else about the function is unchanged.

CREATE OR REPLACE FUNCTION public.app_notification_digest(horizon_days integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with live_projects as (
    select project.id,
           project.name,
           project.status,
           project.due_on,
           project.lead_id,
           coalesce(client.name, 'No client') as client_name,
           lead.full_name as lead_name
    from public.app_projects project
    left join public.app_clients client on client.id = project.client_id
    left join public.app_profiles lead on lead.id = project.lead_id
    where project.archived_at is null
      and project.status not in ('closed', 'paused')
  ),
  open_items as (
    select card.id,
           card.title as label,
           card.status as card_status,
           live_projects.lead_id as notify_profile_id,
           week.due_on as week_due_on,
           week.week_number,
           live_projects.id as project_id,
           live_projects.name as project_name,
           case
             when week.due_on < current_date then 'overdue'
             else 'due'
           end as state
    from public.app_milestone_cards card
    join public.app_milestone_weeks week on week.id = card.milestone_week_id
    join live_projects on live_projects.id = week.project_id
    where card.archived_at is null
      and card.status <> 'completed'
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
        and profile.notify_weekly_summary = true
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
        join public.app_profiles profile on profile.id = open_items.notify_profile_id
        join auth.users account on account.id = profile.id
        where profile.is_active = true
          and profile.archived_at is null
          and profile.notify_milestones = true
        group by profile.id, profile.full_name, account.email
      ) grouped
    ), '[]'::jsonb)
  )
$function$;

comment on function public.app_notification_digest(integer)
is 'Recipients respect app_profiles.notify_milestones and notify_weekly_summary. Owners who opt out of the summary are not listed, and people who opt out of reminders get no items.';

revoke all on function public.app_notification_digest(integer) from public, anon, authenticated;
