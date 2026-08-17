-- Chunk 7, Non-sensitive technical details.
--
-- The table and its policies already exist from Chunk 1. This migration adds
-- the write path: one RPC, shape validation, and a guard that keeps API keys,
-- tokens, passwords and database URLs out of ordinary project notes. Those
-- belong in Chunk 9's credential vault, where they are encrypted and audited.

alter table public.app_project_technical_details
  add column if not exists updated_by uuid references public.app_profiles(id) on delete restrict;

comment on column public.app_project_technical_details.updated_by
is 'Who last saved these details. Owners and active project members may both edit.';

-- A web address we are willing to render as a link. Scheme is restricted to
-- http and https so nothing here can become a javascript: or data: link.
create or replace function private.is_web_url(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select candidate ~* '^https?://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?(/[^\s]*)?$'
$$;

-- A domain may be written bare (gammadevelopers.ai) or as a full URL.
create or replace function private.is_web_host(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (select private.is_web_url(candidate))
    or candidate ~* '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
$$;

-- Deliberately eager. A false positive costs somebody one retype; a false
-- negative puts a live client key in a field with no encryption and no audit.
create or replace function private.looks_like_secret(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select candidate is not null and (
    -- private key blocks
    candidate ~* '-----BEGIN [A-Z ]*PRIVATE KEY-----'
    -- database and broker connection strings
    or candidate ~* '\m(postgres|postgresql|mysql|mariadb|mongodb|mongodb\+srv|redis|rediss|amqp|amqps)://'
    -- any URL carrying user:password@
    or candidate ~ '://[^/@[:space:]:]+:[^/@[:space:]]+@'
    -- provider-shaped tokens
    or candidate ~ '\msk-[A-Za-z0-9_-]{16,}'
    or candidate ~ '\m(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}'
    or candidate ~ '\mgh[pousr]_[A-Za-z0-9]{20,}'
    or candidate ~ '\mgithub_pat_[A-Za-z0-9_]{20,}'
    or candidate ~ '\mxox[baprs]-[A-Za-z0-9-]{10,}'
    or candidate ~ '\mAKIA[0-9A-Z]{16}\M'
    or candidate ~ '\mAIza[0-9A-Za-z_-]{30,}'
    or candidate ~ '\msbp_[A-Za-z0-9]{20,}'
    -- a JSON web token, which is what a Supabase service key looks like
    or candidate ~ '\meyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}'
    -- key = value, where a value actually follows
    or candidate ~* '\m(service[_-]?role[_-]?key|secret[_-]?key|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer[_-]?token|client[_-]?secret|private[_-]?key|passwd|password)\M[[:space:]]*[:=][[:space:]]*\S{8,}'
  )
$$;

comment on function private.looks_like_secret(text)
is 'Chunk 7 guard. Keeps credential-shaped strings out of non-sensitive project fields — they belong in the encrypted vault.';

-- Trims every field, turns blanks into nulls, then refuses anything that is
-- the wrong shape or looks like a secret. Runs whatever writes the row.
create or replace function private.validate_technical_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  field_name text;
  field_label text;
begin
  new.repository_url := nullif(btrim(coalesce(new.repository_url, '')), '');
  new.hosting_url := nullif(btrim(coalesce(new.hosting_url, '')), '');
  new.live_domain := nullif(btrim(coalesce(new.live_domain, '')), '');
  new.staging_domain := nullif(btrim(coalesce(new.staging_domain, '')), '');
  new.design_url := nullif(btrim(coalesce(new.design_url, '')), '');
  new.technical_contact := nullif(btrim(coalesce(new.technical_contact, '')), '');
  new.stack_notes := nullif(btrim(coalesce(new.stack_notes, '')), '');
  new.onboarding_notes := nullif(btrim(coalesce(new.onboarding_notes, '')), '');

  for field_name, field_label in
    select name, label
    from (values
      ('repository_url', 'The repository URL'),
      ('hosting_url', 'The hosting URL'),
      ('live_domain', 'The live domain'),
      ('staging_domain', 'The staging domain'),
      ('design_url', 'The design file URL'),
      ('technical_contact', 'The technical contact'),
      ('stack_notes', 'The stack notes'),
      ('onboarding_notes', 'The onboarding notes')
    ) as fields(name, label)
  loop
    if (select private.looks_like_secret(to_jsonb(new) ->> field_name)) then
      raise exception
        '% looks like a secret. API keys, tokens, passwords and database URLs belong in Credentials, not in project notes.',
        field_label
        using errcode = '23514';
    end if;
  end loop;

  if new.repository_url is not null and not (select private.is_web_url(new.repository_url)) then
    raise exception 'The repository URL must be a full http or https address.' using errcode = '22023';
  end if;
  if new.hosting_url is not null and not (select private.is_web_url(new.hosting_url)) then
    raise exception 'The hosting URL must be a full http or https address.' using errcode = '22023';
  end if;
  if new.design_url is not null and not (select private.is_web_url(new.design_url)) then
    raise exception 'The design file URL must be a full http or https address.' using errcode = '22023';
  end if;
  if new.live_domain is not null and not (select private.is_web_host(new.live_domain)) then
    raise exception 'The live domain must be a domain name or a full https address.' using errcode = '22023';
  end if;
  if new.staging_domain is not null and not (select private.is_web_host(new.staging_domain)) then
    raise exception 'The staging domain must be a domain name or a full https address.' using errcode = '22023';
  end if;

  if char_length(coalesce(new.repository_url, '')) > 500
    or char_length(coalesce(new.hosting_url, '')) > 500
    or char_length(coalesce(new.design_url, '')) > 500
    or char_length(coalesce(new.live_domain, '')) > 253
    or char_length(coalesce(new.staging_domain, '')) > 253 then
    raise exception 'That address is too long to store.' using errcode = '22023';
  end if;
  if char_length(coalesce(new.technical_contact, '')) > 200 then
    raise exception 'Keep the technical contact under 200 characters.' using errcode = '22023';
  end if;
  if char_length(coalesce(new.stack_notes, '')) > 4000
    or char_length(coalesce(new.onboarding_notes, '')) > 4000 then
    raise exception 'Keep each set of notes under 4000 characters.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger app_technical_validate
  before insert or update on public.app_project_technical_details
  for each row execute function private.validate_technical_details();

-- Owners and active project members both edit, so this is not owner-only like
-- the milestone RPCs. Membership is still what decides.
create or replace function public.app_save_technical_details(
  target_project_id uuid,
  new_repository_url text default null,
  new_hosting_url text default null,
  new_live_domain text default null,
  new_staging_domain text default null,
  new_design_url text default null,
  new_technical_contact text default null,
  new_stack_notes text default null,
  new_onboarding_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.app_projects project where project.id = target_project_id
  ) then
    raise exception 'That project could not be found.' using errcode = '23503';
  end if;

  if not (select private.can_work_on_project(target_project_id)) then
    raise exception 'You are not on this project.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.app_projects project
    where project.id = target_project_id and project.archived_at is not null
  ) then
    raise exception 'This project is archived. Restore it before editing its technical details.'
      using errcode = '42501';
  end if;

  insert into public.app_project_technical_details (
    project_id, repository_url, hosting_url, live_domain, staging_domain,
    design_url, technical_contact, stack_notes, onboarding_notes, updated_by
  )
  values (
    target_project_id, new_repository_url, new_hosting_url, new_live_domain,
    new_staging_domain, new_design_url, new_technical_contact, new_stack_notes,
    new_onboarding_notes, (select auth.uid())
  )
  on conflict (project_id) do update
  set repository_url = excluded.repository_url,
      hosting_url = excluded.hosting_url,
      live_domain = excluded.live_domain,
      staging_domain = excluded.staging_domain,
      design_url = excluded.design_url,
      technical_contact = excluded.technical_contact,
      stack_notes = excluded.stack_notes,
      onboarding_notes = excluded.onboarding_notes,
      updated_by = (select auth.uid());
end;
$$;

comment on function public.app_save_technical_details(uuid, text, text, text, text, text, text, text, text)
is 'The only client write path for project technical details. Owners and active project members; archived projects are read-only.';

-- The RPC is the whole write path, so nobody edits the table directly. The
-- insert and update policies stay as a second line of defence.
revoke insert, update on table public.app_project_technical_details from authenticated;

revoke all on function public.app_save_technical_details(uuid, text, text, text, text, text, text, text, text) from public;
revoke all on function public.app_save_technical_details(uuid, text, text, text, text, text, text, text, text) from anon;
grant execute on function public.app_save_technical_details(uuid, text, text, text, text, text, text, text, text) to authenticated;

revoke all on function private.is_web_url(text) from public;
revoke all on function private.is_web_host(text) from public;
revoke all on function private.looks_like_secret(text) from public;

comment on table public.app_project_technical_details
is 'Non-sensitive project working links and notes. Readable by owners and active project members only — never finance, never anonymous. Secrets live in the Chunk 9 vault.';
