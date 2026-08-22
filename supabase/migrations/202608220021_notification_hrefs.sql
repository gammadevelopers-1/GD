-- Making the bell's links actually go somewhere.
--
-- The notification writers built their hrefs from app_projects.id, but every
-- project route resolves by public_id -- getProjectCore filters on it, and the
-- tab helper composes URLs from it. So /projects/<uuid> matched no project and
-- the layout called notFound(). Every link in the bell was a dead end.
--
-- The href is stored at write time rather than derived at read time, which is
-- deliberate: a notification is a delivered thing, and the row records where it
-- pointed when it was sent. That choice is why this needs a backfill as well as
-- a fix -- rows already written carry the broken path and no amount of new code
-- corrects them.

create or replace function public.app_notify_project_member(
  target_project_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_name text;
  project_slug text;
begin
  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select name, public_id into project_name, project_slug
  from public.app_projects
  where id = target_project_id and archived_at is null;

  if project_name is null then
    return;
  end if;

  perform private.deliver_notification(
    array[target_profile_id],
    'project_member',
    'Added to ' || project_name,
    (select private.actor_name()) || ' put you on this project.',
    '/projects/' || project_slug
  );
end;
$$;

create or replace function public.app_notify_project_lead(
  target_project_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_name text;
  project_slug text;
begin
  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select name, public_id into project_name, project_slug
  from public.app_projects
  where id = target_project_id and archived_at is null;

  if project_name is null then
    return;
  end if;

  perform private.deliver_notification(
    array[target_profile_id],
    'project_lead',
    'You lead ' || project_name,
    (select private.actor_name()) || ' made you the lead on this project.',
    '/projects/' || project_slug
  );
end;
$$;

create or replace function public.app_notify_week_planned(target_week_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  project_name text;
  project_slug text;
  week_number integer;
  due_on date;
begin
  target_project_id := (select private.milestone_week_project(target_week_id));

  if target_project_id is null
     or not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select week.week_number, week.due_on, project.name, project.public_id
    into week_number, due_on, project_name, project_slug
  from public.app_milestone_weeks week
  join public.app_projects project on project.id = week.project_id
  where week.id = target_week_id and week.archived_at is null;

  if week_number is null then
    return;
  end if;

  perform private.deliver_notification(
    (
      select coalesce(array_agg(member.profile_id), array[]::uuid[])
      from public.app_project_members member
      where member.project_id = target_project_id
        and member.archived_at is null
    ),
    'week_planned',
    'Week ' || week_number::text || ' on ' || project_name,
    'Due ' || to_char(due_on, 'FMDD Mon YYYY') || '.',
    '/projects/' || project_slug || '/milestone'
  );
end;
$$;

create or replace function public.app_notify_task_assigned(target_card_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  project_name text;
  project_slug text;
  card_title text;
  assignee uuid;
begin
  target_project_id := (select private.milestone_card_project(target_card_id));

  if target_project_id is null
     or not (select private.can_work_on_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select card.title, card.assigned_to, project.name, project.public_id
    into card_title, assignee, project_name, project_slug
  from public.app_milestone_cards card
  join public.app_milestone_weeks week on week.id = card.milestone_week_id
  join public.app_projects project on project.id = week.project_id
  where card.id = target_card_id and card.archived_at is null;

  if assignee is null then
    return;
  end if;

  perform private.deliver_notification(
    array[assignee],
    'task_assigned',
    card_title,
    (select private.actor_name()) || ' assigned this to you on ' || project_name || '.',
    '/projects/' || project_slug || '/milestone'
  );
end;
$$;

create or replace function public.app_grant_credential_access(
  target_credential_id uuid,
  target_profile_id uuid,
  access_level text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  requested public.app_credential_level;
  existing public.app_credential_level;
  credential_name text;
  project_name text;
  project_slug text;
begin
  perform private.assert_credential_owner(target_credential_id);
  target_project_id := (select private.credential_project(target_credential_id));

  if access_level not in ('use', 'manage') then
    raise exception 'Access is use or manage.' using errcode = '22023';
  end if;
  requested := access_level::public.app_credential_level;

  if not exists (
    select 1
    from public.app_project_members member
    join public.app_profiles profile on profile.id = member.profile_id
    where member.project_id = target_project_id
      and member.profile_id = target_profile_id
      and member.archived_at is null
      and profile.is_active = true
      and profile.archived_at is null
  ) then
    raise exception 'That person is not on this project.' using errcode = '23514';
  end if;

  select access into existing
  from public.app_credential_grants
  where credential_id = target_credential_id
    and profile_id = target_profile_id
    and revoked_at is null;

  insert into public.app_credential_grants
    (credential_id, profile_id, access, granted_by, granted_at, revoked_at, revoked_by)
  values (
    target_credential_id, target_profile_id, requested,
    (select auth.uid()), now(), null, null
  )
  on conflict (credential_id, profile_id) do update
  set access = excluded.access,
      granted_by = excluded.granted_by,
      granted_at = now(),
      revoked_at = null,
      revoked_by = null;

  perform private.record_credential_event(
    target_credential_id,
    case
      when existing is null then 'credential.access_granted'
      when existing <> requested then 'credential.access_level_changed'
      else 'credential.access_granted'
    end,
    jsonb_build_object(
      'profile_id', target_profile_id,
      'access', access_level,
      'previous_access', existing
    )
  );

  if existing is null or existing <> requested then
    select credential.name, project.name, project.public_id
      into credential_name, project_name, project_slug
    from public.app_project_credentials credential
    join public.app_projects project on project.id = credential.project_id
    where credential.id = target_credential_id;

    perform private.deliver_notification(
      array[target_profile_id],
      'env_access',
      credential_name,
      (select private.actor_name())
        || ' gave you ' || access_level || ' access on ' || project_name || '.',
      '/projects/' || project_slug || '/technical'
    );
  end if;
end;
$$;

revoke all on function public.app_notify_project_member(uuid, uuid) from public, anon;
revoke all on function public.app_notify_project_lead(uuid, uuid) from public, anon;
revoke all on function public.app_notify_week_planned(uuid) from public, anon;
revoke all on function public.app_notify_task_assigned(uuid) from public, anon;
revoke all on function public.app_grant_credential_access(uuid, uuid, text) from public, anon;
grant execute on function public.app_notify_project_member(uuid, uuid) to authenticated;
grant execute on function public.app_notify_project_lead(uuid, uuid) to authenticated;
grant execute on function public.app_notify_week_planned(uuid) to authenticated;
grant execute on function public.app_notify_task_assigned(uuid) to authenticated;
grant execute on function public.app_grant_credential_access(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The rows already sent
-- ---------------------------------------------------------------------------

-- Rewrites '/projects/<uuid>...' to '/projects/<public_id>...', keeping whatever
-- segment followed. A notification whose project has since been deleted keeps
-- its dead href rather than being silently repointed somewhere else.
update public.app_notifications notification
set href = '/projects/' || project.public_id
           || substring(notification.href from '^/projects/[0-9a-f-]{36}(.*)$')
from public.app_projects project
where notification.href ~ '^/projects/[0-9a-f-]{36}'
  and project.id = substring(notification.href from '^/projects/([0-9a-f-]{36})')::uuid;
