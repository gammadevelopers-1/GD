-- The Technical tab is withdrawn from the client view.
--
-- Taking the tab out of the interface would have stopped it being rendered. It
-- would not have stopped it being read: the payload function is what a client's
-- session can actually reach, so the four fields come out of there too. A client
-- now has no query that returns a domain, a design file or a stack note, in the
-- same way they already had none that returns a credential.
--
-- The technical row also stops feeding lastUpdatedAt. That timestamp is meant to
-- tell a client whether anything they can see has moved, and an edit to a page
-- they no longer have would have advanced the clock while their view sat still.

create or replace function private.client_portal_payload(
  target_project_id uuid,
  editing boolean
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'project', (
      select jsonb_build_object(
        'publicId', project.public_id,
        'name', project.name,
        'description', project.description,
        'status', project.status::text,
        'startsOn', project.starts_on,
        'dueOn', project.due_on,
        'bannerPath', project.banner_path,
        'bannerFit', coalesce(project.banner_fit, 'cover')
      )
      from public.app_projects project
      where project.id = target_project_id
    ),
    'canEditMilestones', editing,
    -- Silence should read as "nothing changed", not as "nobody is working", so
    -- this is the newest mark anywhere the client can see rather than the
    -- project row's own timestamp.
    'lastUpdatedAt', (
      select max(moment) from (
        select project.updated_at as moment
        from public.app_projects project
        where project.id = target_project_id
        union all
        select card.updated_at
        from public.app_milestone_cards card
        join public.app_milestone_weeks week on week.id = card.milestone_week_id
        where week.project_id = target_project_id
          and week.archived_at is null
          and card.archived_at is null
        union all
        select board.updated_at
        from public.app_week_idea_boards board
        join public.app_milestone_weeks week on week.id = board.milestone_week_id
        where week.project_id = target_project_id
          and week.archived_at is null
      ) marks
    ),
    'weeks', coalesce((
      select jsonb_agg(week_row order by sort_number)
      from (
        select
          week.week_number as sort_number,
          jsonb_build_object(
            'id', week.id,
            'number', week.week_number,
            'startsOn', week.starts_on,
            'dueOn', week.due_on,
            'focus', week.focus,
            'completedAt', week.completed_at,
            'ideaDoc', (
              select board.doc
              from public.app_week_idea_boards board
              where board.milestone_week_id = week.id
            ),
            'items', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', card.id,
                  'title', card.title,
                  'status', card.status,
                  'done', card.status = 'completed'
                )
                order by card.position, card.created_at
              )
              from public.app_milestone_cards card
              where card.milestone_week_id = week.id
                and card.board = 'work'
                and card.archived_at is null
            ), '[]'::jsonb)
          ) as week_row
        from public.app_milestone_weeks week
        where week.project_id = target_project_id
          and week.archived_at is null
      ) weeks
    ), '[]'::jsonb),
    -- Who is on this project and what they do. No ids, no email, no employment,
    -- nothing that would identify them anywhere else in the platform.
    'team', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', profile.full_name,
          'responsibility', member.responsibility,
          'avatarPath', profile.avatar_path,
          'isLead', project.lead_id = profile.id
        )
        order by (project.lead_id = profile.id) desc, profile.full_name
      )
      from public.app_project_members member
      join public.app_profiles profile on profile.id = member.profile_id
      join public.app_projects project on project.id = member.project_id
      where member.project_id = target_project_id
        and member.archived_at is null
        and profile.archived_at is null
        and profile.is_active
    ), '[]'::jsonb)
  )
$$;

revoke execute on function private.client_portal_payload(uuid, boolean) from public, anon;
