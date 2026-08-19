-- "Preview as client" is only worth having if it cannot be wrong. Two functions
-- that each build the payload would drift the first time one was edited, and
-- the drift would be invisible until a client saw something the preview did
-- not. So the payload moves into one private builder, and the two public
-- entry points differ only in who they let through.

create or replace function private.client_portal_payload(target_project_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with settings as (
    select
      coalesce(s.share_ideaboard, false) as share_ideaboard,
      coalesce(s.share_staging, false) as share_staging,
      coalesce(s.share_design, false) as share_design,
      s.contact_name,
      s.contact_email
    from (select 1) one
    left join public.app_project_client_settings s
      on s.project_id = target_project_id
  )
  select jsonb_build_object(
    'project', (
      select jsonb_build_object(
        'publicId', project.public_id,
        'name', project.name,
        'description', project.description,
        'status', project.status::text,
        'startsOn', project.starts_on,
        'dueOn', project.due_on,
        'updatedAt', project.updated_at
      )
      from public.app_projects project
      where project.id = target_project_id
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
            'items', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', card.id,
                  'title', card.title,
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
    ), '[]'::jsonb),
    'ideaboard', case
      when (select share_ideaboard from settings) then (
        select board.doc
        from public.app_project_idea_boards board
        where board.project_id = target_project_id
      )
      else null
    end,
    'links', coalesce((
      select jsonb_build_object(
        'liveDomain', technical.live_domain,
        'stagingDomain', case
          when (select share_staging from settings) then technical.staging_domain
        end,
        'designUrl', case
          when (select share_design from settings) then technical.design_url
        end
      )
      from public.app_project_technical_details technical
      where technical.project_id = target_project_id
    ), jsonb_build_object(
      'liveDomain', null, 'stagingDomain', null, 'designUrl', null
    )),
    'files', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', file.id,
          'name', file.file_name,
          'size', file.byte_size,
          'addedAt', file.created_at
        )
        order by file.created_at desc
      )
      from public.app_project_client_files file
      where file.project_id = target_project_id
        and file.client_visible
        and file.archived_at is null
    ), '[]'::jsonb),
    'contact', jsonb_build_object(
      'name', (select contact_name from settings),
      'email', (select contact_email from settings)
    )
  )
$$;

revoke execute on function private.client_portal_payload(uuid) from public, anon;

create or replace function public.app_client_portal(target_public_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  select id into target_project_id
  from public.app_projects
  where public_id = target_public_id and archived_at is null;

  if target_project_id is null then
    return null;
  end if;

  -- The id in the URL is never trusted. A live link to this exact project is
  -- the only thing that answers this, and it is asked on every single load.
  if not (select private.is_client_of(target_project_id)) then
    return null;
  end if;

  return (select private.client_portal_payload(target_project_id));
end;
$$;

revoke execute on function public.app_client_portal(text) from public, anon;
grant execute on function public.app_client_portal(text) to authenticated;

create or replace function public.app_client_portal_preview(target_public_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  if not (select private.is_owner()) then
    return null;
  end if;

  select id into target_project_id
  from public.app_projects
  where public_id = target_public_id and archived_at is null;

  if target_project_id is null then
    return null;
  end if;

  return (select private.client_portal_payload(target_project_id));
end;
$$;

revoke execute on function public.app_client_portal_preview(text) from public, anon;
grant execute on function public.app_client_portal_preview(text) to authenticated;

comment on function public.app_client_portal_preview(text)
is 'Owner-only. Returns byte for byte what app_client_portal returns to a client, because both read the same private builder.';
