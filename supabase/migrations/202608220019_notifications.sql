-- The bell in the header.
--
-- Until now the only thing this platform told anyone was the nightly email
-- digest, which answers "what is due" and nothing else. The things a person
-- actually needs to hear about happen in the middle of someone else's working
-- day: they were put on a project, they were handed a secret, a week was
-- planned around them. Those were invisible unless they went looking.
--
-- So: one row per person per event, written where the event happens.
--
-- Two decisions worth stating. First, the fan-out is at write time rather than
-- read time -- a notification is a delivered thing, not a query over the audit
-- log, so a later membership change cannot retroactively reveal or withdraw
-- something someone was already told. Second, nothing but a definer function
-- writes here. There is a select policy for your own row and no insert, update
-- or delete policy at all, so a member with a token cannot manufacture a
-- notification for a colleague or quietly delete one of their own.

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.app_profiles(id) on delete cascade,
  actor_id uuid references public.app_profiles(id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  href text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint app_notifications_kind_known check (
    kind in (
      'env_access',
      'project_member',
      'project_lead',
      'week_planned',
      'task_assigned'
    )
  ),
  constraint app_notifications_title_length check (char_length(title) between 1 and 160)
);

comment on table public.app_notifications
is 'One row per recipient per event. Written only by the definer functions below; readable only by the person it belongs to.';

create index if not exists app_notifications_inbox_idx
  on public.app_notifications (profile_id, created_at desc);

create index if not exists app_notifications_unread_idx
  on public.app_notifications (profile_id)
  where read_at is null;

alter table public.app_notifications enable row level security;

drop policy if exists "notifications_read_own" on public.app_notifications;
create policy "notifications_read_own" on public.app_notifications
  for select to authenticated
  using (profile_id = (select auth.uid()));

revoke all on table public.app_notifications from public, anon;
grant select on table public.app_notifications to authenticated;

-- ---------------------------------------------------------------------------
-- The one writer
-- ---------------------------------------------------------------------------

-- Nobody is told about their own action, and a dormant or archived account is
-- not written to at all. Both are enforced here rather than at each call site
-- so there is one place to be wrong.
create or replace function private.deliver_notification(
  recipients uuid[],
  event_kind text,
  event_title text,
  event_body text,
  event_href text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_notifications
    (profile_id, actor_id, kind, title, body, href)
  select distinct
    profile.id,
    (select auth.uid()),
    event_kind,
    event_title,
    event_body,
    event_href
  from unnest(coalesce(recipients, array[]::uuid[])) as recipient(id)
  join public.app_profiles profile on profile.id = recipient.id
  where profile.is_active = true
    and profile.archived_at is null
    and profile.id is distinct from (select auth.uid());
$$;

create or replace function private.actor_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(display_name, full_name, 'Someone')
  from public.app_profiles
  where id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Reading and clearing
-- ---------------------------------------------------------------------------

-- Null marks the whole inbox read, which is what the "Mark all read" control
-- sends. Anything else is scoped to the caller's own rows regardless.
create or replace function public.app_mark_notifications_read(target_ids uuid[] default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.app_notifications
  set read_at = now()
  where profile_id = (select auth.uid())
    and read_at is null
    and (target_ids is null or id = any(target_ids));
$$;

revoke all on function public.app_mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.app_mark_notifications_read(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Where the events are
-- ---------------------------------------------------------------------------

-- Each of these repeats the authorisation its caller already did. A definer
-- function that trusts its caller is a hole, and these are reachable by any
-- authenticated token, not only through the server action that normally calls
-- them.

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
begin
  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select name into project_name
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
    '/projects/' || target_project_id::text
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
begin
  if not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select name into project_name
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
    '/projects/' || target_project_id::text
  );
end;
$$;

-- Everyone still on the project hears about a new week, because a week is the
-- unit the whole team plans against.
create or replace function public.app_notify_week_planned(target_week_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  project_name text;
  week_number integer;
  due_on date;
begin
  target_project_id := (select private.milestone_week_project(target_week_id));

  if target_project_id is null
     or not (select private.can_manage_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select week.week_number, week.due_on, project.name
    into week_number, due_on, project_name
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
    '/projects/' || target_project_id::text || '/milestone'
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
  card_title text;
  assignee uuid;
begin
  target_project_id := (select private.milestone_card_project(target_card_id));

  if target_project_id is null
     or not (select private.can_work_on_project(target_project_id)) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  select card.title, card.assigned_to, project.name
    into card_title, assignee, project_name
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
    '/projects/' || target_project_id::text || '/milestone'
  );
end;
$$;

revoke all on function public.app_notify_project_member(uuid, uuid) from public, anon;
revoke all on function public.app_notify_project_lead(uuid, uuid) from public, anon;
revoke all on function public.app_notify_week_planned(uuid) from public, anon;
revoke all on function public.app_notify_task_assigned(uuid) from public, anon;
grant execute on function public.app_notify_project_member(uuid, uuid) to authenticated;
grant execute on function public.app_notify_project_lead(uuid, uuid) to authenticated;
grant execute on function public.app_notify_week_planned(uuid) to authenticated;
grant execute on function public.app_notify_task_assigned(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Handing someone a secret
-- ---------------------------------------------------------------------------

-- Unchanged from 202608220004 except for the delivery at the end. Being given
-- reach into a credential is the event on this platform a person is most
-- entitled to hear about without going looking, so it is told rather than only
-- logged.
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
    select credential.name, project.name
      into credential_name, project_name
    from public.app_project_credentials credential
    join public.app_projects project on project.id = credential.project_id
    where credential.id = target_credential_id;

    perform private.deliver_notification(
      array[target_profile_id],
      'env_access',
      credential_name,
      (select private.actor_name())
        || ' gave you ' || access_level || ' access on ' || project_name || '.',
      '/projects/' || target_project_id::text || '/technical'
    );
  end if;
end;
$$;

revoke all on function public.app_grant_credential_access(uuid, uuid, text) from public, anon;
grant execute on function public.app_grant_credential_access(uuid, uuid, text) to authenticated;
