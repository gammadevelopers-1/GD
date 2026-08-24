-- The audit history could say what happened but not from where.
--
-- app_audit_logs already carried the forwarded client IP. The browser and OS
-- came along on every request too -- lib/supabase/server.ts forwards the
-- user-agent header -- and were thrown away. An access event is much easier to
-- judge when you can see it came from the same laptop as everything else.
--
-- Env groups were not audited at all, so "who created the Payments group in
-- Tom's version" had no answer. A trigger records it now, which catches every
-- path into the table rather than the ones someone remembered to instrument.

alter table public.app_audit_logs
  add column if not exists user_agent text;

comment on column public.app_audit_logs.user_agent is
  'The browser and OS the actor used, as forwarded by the app. Null for events raised by a trigger with no request behind them.';

-- ---------------------------------------------------------------------------
-- One place that reads a forwarded header, so the three recorders agree
-- ---------------------------------------------------------------------------

create or replace function private.request_header(header_name text)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(
    btrim(split_part(
      coalesce(
        (nullif(current_setting('request.headers', true), '')::json
          ->> header_name),
        ''
      ),
      ',',
      1
    )),
    ''
  )
$$;

create or replace function private.record_credential_event(
  target_credential_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata, ip, user_agent)
  values (
    (select auth.uid()),
    action_name,
    'credential',
    target_credential_id,
    coalesce(event_metadata, '{}'::jsonb),
    (select private.request_header('x-gamma-client-ip')),
    (select private.request_header('user-agent'))
  )
$$;

create or replace function private.record_link_event(
  target_link_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata, ip, user_agent)
  values (
    (select auth.uid()),
    action_name,
    'project_link',
    target_link_id,
    coalesce(event_metadata, '{}'::jsonb),
    (select private.request_header('x-gamma-client-ip')),
    (select private.request_header('user-agent'))
  )
$$;

-- ---------------------------------------------------------------------------
-- Env group events, recorded by trigger so no write path can miss one
-- ---------------------------------------------------------------------------

create or replace function private.record_env_group_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_action text;
  event_detail text;
  subject public.app_env_groups;
begin
  if tg_op = 'INSERT' then
    subject := new;
    event_action := 'env_group.created';
    event_detail := format('Created group %L', new.name);
  elsif tg_op = 'DELETE' then
    subject := old;
    event_action := 'env_group.deleted';
    event_detail := format('Deleted group %L', old.name);
  elsif old.archived_at is null and new.archived_at is not null then
    subject := new;
    event_action := 'env_group.deleted';
    event_detail := format('Deleted group %L', new.name);
  elsif old.name is distinct from new.name then
    subject := new;
    event_action := 'env_group.renamed';
    event_detail := format('Renamed group %L to %L', old.name, new.name);
  else
    return coalesce(new, old);
  end if;

  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata, ip, user_agent)
  values (
    (select auth.uid()),
    event_action,
    'env_group',
    subject.id,
    jsonb_build_object(
      'project_id', subject.project_id,
      'group_name', subject.name,
      'group_kind', subject.kind,
      'owner_profile_id', subject.owner_profile_id,
      'detail', event_detail
    ),
    (select private.request_header('x-gamma-client-ip')),
    (select private.request_header('user-agent'))
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists record_env_group_event on public.app_env_groups;
create trigger record_env_group_event
  after insert or update or delete on public.app_env_groups
  for each row execute function private.record_env_group_event();
