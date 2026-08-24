-- A member could not read the value in their own private copy.
--
-- Personal copies gave the copy's owner SELECT on the credential row through
-- credentials_select_allowed, so the key appeared in their version and the
-- metadata was theirs to edit. credential_access_level -- which is what
-- actually gates the sealed value -- was never taught the same rule. It still
-- asked only "is there a grant row?", so copying a variable out of your own
-- version was refused, and app_read_credential_secret wrote a
-- credential.access_denied entry for it: the audit log filled with denials
-- of people reading secrets they typed in themselves.
--
-- Owning the copy is now an access level in its own right. It sits after the
-- archived and membership checks, so leaving the project still takes the value
-- away, exactly as a revoked grant does.

create or replace function private.credential_access_level(target_credential_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
  target_group_id uuid;
  credential_archived boolean;
  project_archived boolean;
  grant_level public.app_credential_level;
begin
  select credential.project_id,
         credential.env_group_id,
         credential.archived_at is not null,
         project.archived_at is not null
  into target_project_id, target_group_id, credential_archived, project_archived
  from public.app_project_credentials credential
  join public.app_projects project on project.id = credential.project_id
  where credential.id = target_credential_id;

  if target_project_id is null then
    return null;
  end if;

  if (select private.is_owner()) then
    return 'owner';
  end if;

  if credential_archived or project_archived then
    return null;
  end if;

  -- A grant is revoked when someone leaves a project, but checking membership
  -- as well means a grant row that outlived its trigger still grants nothing.
  if not (select private.is_project_member(target_project_id)) then
    return null;
  end if;

  -- Your own copy. The value is one you put there, so reading it back is not
  -- a disclosure, and it needs no grant from anybody.
  if target_group_id is not null
     and (select private.owns_env_group(target_group_id))
  then
    return 'manage';
  end if;

  select access
  into grant_level
  from public.app_credential_grants
  where credential_id = target_credential_id
    and profile_id = (select auth.uid())
    and revoked_at is null;

  if grant_level is null then
    return null;
  end if;

  return grant_level::text;
end;
$$;
