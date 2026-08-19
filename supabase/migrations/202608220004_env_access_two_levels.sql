-- Sharing a variable had three rungs: see, use and manage. The middle question
-- "who can see this exists but not read it" turned out to have no answer worth
-- acting on, and the extra rung made the access list harder to read when the
-- only thing anyone asks is who can reach a value.
--
-- Two remain. 'use' is now shown as "Copy value" and 'manage' as "Full access".
-- The enum keeps its third label so old audit rows still resolve, but nothing
-- can be granted at that level again and no grant is left holding it.

update public.app_credential_grants
set access = 'use'
where access = 'see';

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
begin
  -- Granting stays owner-only. A manage grant lets someone change a variable,
  -- not widen who else can reach it.
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
end;
$$;
