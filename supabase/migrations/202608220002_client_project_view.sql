-- The client sees the project, not a digest of it.
--
-- The first cut of the portal was one scrolling summary page with its own
-- sharing switches and a file drop. This replaces it with the four tabs the
-- internal page has -- Overview, Team, Milestone, Technical -- rendered from
-- one payload, and narrows what an owner decides down to a single question:
-- may this client tick things on the milestone board.
--
-- The access model underneath does not move. A client is still not an
-- app_profiles row, so private.current_app_role() is null for them and every
-- policy written in terms of is_owner / is_finance / is_project_member denies
-- them by construction. They still hold no select policy on any project table.
-- Everything they read comes out of private.client_portal_payload, and the
-- only two things they can write go through two functions that re-ask who they
-- are before touching a row.

-- ---------------------------------------------------------------------------
-- One switch instead of four
-- ---------------------------------------------------------------------------

alter table public.app_project_client_access
  add column if not exists can_edit_milestones boolean not null default false;

comment on column public.app_project_client_access.can_edit_milestones
is 'The only write access a client can ever be given: ticking work items and writing in the week idea board. Everything else is read-only whatever this says.';

-- ---------------------------------------------------------------------------
-- The password we generate is the password
-- ---------------------------------------------------------------------------

-- The temporary-password dance is gone. An owner generates a password, hands it
-- over, and that is the client's password until an owner generates another one.
-- Recovery is regeneration, which is why there is no reset mail and no window
-- for a password that was issued and never used.
drop function if exists public.app_client_password_set();

alter table public.app_client_users
  drop column if exists must_set_password,
  drop column if exists password_set_at,
  drop column if exists temp_password_expires_at;

alter table public.app_client_users
  add column if not exists password_issued_at timestamptz;

comment on column public.app_client_users.password_issued_at
is 'When an owner last generated a password for this account. The password itself is only ever in Auth''s hash and on the owner''s screen once.';

create or replace function private.is_client_of(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_project_client_access access
    join public.app_client_users account on account.id = access.client_user_id
    join public.app_projects project on project.id = access.project_id
    where access.project_id = target_project_id
      and access.client_user_id = (select auth.uid())
      and access.revoked_at is null
      and account.archived_at is null
      and project.archived_at is null
  )
$$;

-- The same question with the switch on the end. Kept separate so a read path
-- can never accidentally satisfy a write check.
create or replace function private.client_may_edit_milestones(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_project_client_access access
    join public.app_client_users account on account.id = access.client_user_id
    join public.app_projects project on project.id = access.project_id
    where access.project_id = target_project_id
      and access.client_user_id = (select auth.uid())
      and access.revoked_at is null
      and access.can_edit_milestones
      and account.archived_at is null
      and project.archived_at is null
  )
$$;

revoke execute on function private.client_may_edit_milestones(uuid) from public, anon;
grant execute on function private.client_may_edit_milestones(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Sharing switches and the file drop are gone
-- ---------------------------------------------------------------------------

-- What the client sees is now decided by which tab they are on, not by four
-- booleans an owner had to remember to set. The Technical tab carries the
-- non-sensitive links outright; nothing else on that tab has a client path at
-- all, which is a stronger statement than a switch that defaults to off.
drop function if exists public.app_client_file_path(uuid);

-- The three policies were the only way anything reached the deliverables
-- bucket, so dropping them closes it to every role including owners. The
-- bucket row itself is left alone: Storage refuses direct deletes from SQL and
-- wants its own API, and an empty bucket nothing can read and no code path
-- mentions is not worth a second migration path to remove.
drop policy if exists "client_files_bucket_owner_select" on storage.objects;
drop policy if exists "client_files_bucket_owner_insert" on storage.objects;
drop policy if exists "client_files_bucket_owner_update" on storage.objects;

drop table if exists public.app_project_client_files;
drop table if exists public.app_project_client_settings;

-- ---------------------------------------------------------------------------
-- A client write must not be mistaken for an internal one
-- ---------------------------------------------------------------------------

-- app_milestone_cards.updated_by references app_profiles, and the trigger that
-- stamps it takes auth.uid() unconditionally. A client ticking a task would
-- have failed on that foreign key. Authorship now branches the same way the
-- audit log already does: internal writers land in updated_by, clients land in
-- client_updated_by, and neither column can hold the other kind of account.
alter table public.app_milestone_cards
  add column if not exists client_updated_by uuid
    references public.app_client_users(id) on delete restrict;

alter table public.app_week_idea_boards
  add column if not exists client_updated_by uuid
    references public.app_client_users(id) on delete restrict;

create or replace function private.set_updated_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  writer uuid := (select auth.uid());
begin
  if writer is null then
    return new;
  end if;

  if exists (select 1 from public.app_profiles where id = writer) then
    new.updated_by := writer;
    new.client_updated_by := null;
  elsif exists (select 1 from public.app_client_users where id = writer) then
    new.client_updated_by := writer;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- The payload. This function is the entire allowlist.
-- ---------------------------------------------------------------------------

-- Nothing is selected here and then hidden by the interface. What is not built
-- into this object does not leave the database. Note what is absent and has no
-- branch that could bring it back: financials, credentials, environment
-- variables and groups, repository and hosting URLs, onboarding notes, profile
-- ids, employment, internal notes, and every other project.
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
        union all
        select technical.updated_at
        from public.app_project_technical_details technical
        where technical.project_id = target_project_id
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
    ), '[]'::jsonb),
    -- Four fields, named one at a time. repository_url, hosting_url,
    -- technical_contact and onboarding_notes are internal and are simply not
    -- here; credentials and environment variables have no client-facing
    -- function anywhere in this schema.
    'technical', coalesce((
      select jsonb_build_object(
        'liveDomain', technical.live_domain,
        'stagingDomain', technical.staging_domain,
        'designUrl', technical.design_url,
        'stackNotes', technical.stack_notes
      )
      from public.app_project_technical_details technical
      where technical.project_id = target_project_id
    ), jsonb_build_object(
      'liveDomain', null,
      'stagingDomain', null,
      'designUrl', null,
      'stackNotes', null
    ))
  )
$$;

revoke execute on function private.client_portal_payload(uuid, boolean) from public, anon;

drop function if exists private.client_portal_payload(uuid);

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

  return (select private.client_portal_payload(
    target_project_id,
    (select private.client_may_edit_milestones(target_project_id))
  ));
end;
$$;

revoke execute on function public.app_client_portal(text) from public, anon;
grant execute on function public.app_client_portal(text) to authenticated;

-- "Preview as client" is only worth having if it cannot be wrong. Both entry
-- points read the same builder, so the preview cannot drift into showing less
-- than a client sees, or more.
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

  return (select private.client_portal_payload(target_project_id, false));
end;
$$;

revoke execute on function public.app_client_portal_preview(text) from public, anon;
grant execute on function public.app_client_portal_preview(text) to authenticated;

-- ---------------------------------------------------------------------------
-- The two things a client can write, when an owner has said so
-- ---------------------------------------------------------------------------

create or replace function public.app_client_set_item_done(
  target_card_id uuid,
  done boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  owning_project uuid;
begin
  -- The card id decides which project is being written to, not the caller.
  select week.project_id into owning_project
  from public.app_milestone_cards card
  join public.app_milestone_weeks week on week.id = card.milestone_week_id
  where card.id = target_card_id
    and card.board = 'work'
    and card.archived_at is null
    and week.archived_at is null;

  if owning_project is null then
    raise exception 'That item is unavailable.' using errcode = '42501';
  end if;

  if not (select private.client_may_edit_milestones(owning_project)) then
    raise exception 'That item is unavailable.' using errcode = '42501';
  end if;

  -- Ticking and unticking, and nothing else. A client cannot block an item,
  -- mark it as not completed, move it between boards, retitle it or delete it.
  update public.app_milestone_cards
  set status = case when done then 'completed' else 'in_progress' end,
      completed_at = case when done then now() else null end
  where id = target_card_id;

  perform private.record_client_event(
    owning_project,
    case when done then 'client.item_ticked' else 'client.item_unticked' end,
    jsonb_build_object('cardId', target_card_id)
  );

  return done;
end;
$$;

revoke all on function public.app_client_set_item_done(uuid, boolean) from public, anon;
grant execute on function public.app_client_set_item_done(uuid, boolean) to authenticated;

create or replace function public.app_client_save_week_idea(
  target_week_id uuid,
  new_doc jsonb
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  owning_project uuid;
  saved_at timestamptz;
begin
  select week.project_id into owning_project
  from public.app_milestone_weeks week
  where week.id = target_week_id
    and week.archived_at is null;

  if owning_project is null then
    raise exception 'That week is unavailable.' using errcode = '42501';
  end if;

  if not (select private.client_may_edit_milestones(owning_project)) then
    raise exception 'That week is unavailable.' using errcode = '42501';
  end if;

  if jsonb_typeof(new_doc) is distinct from 'object'
     or new_doc ->> 'type' is distinct from 'doc' then
    raise exception 'That is not a document.' using errcode = '22023';
  end if;

  if pg_column_size(new_doc) > 2000000 then
    raise exception 'This board is too large to save.' using errcode = '22023';
  end if;

  insert into public.app_week_idea_boards
    (milestone_week_id, doc, updated_by, client_updated_by)
  values (target_week_id, new_doc, null, (select auth.uid()))
  on conflict (milestone_week_id) do update
    set doc = excluded.doc,
        updated_by = null,
        client_updated_by = excluded.client_updated_by
  returning updated_at into saved_at;

  perform private.record_client_event(
    owning_project, 'client.idea_board_saved', jsonb_build_object('weekId', target_week_id)
  );

  return saved_at;
end;
$$;

revoke all on function public.app_client_save_week_idea(uuid, jsonb) from public, anon;
grant execute on function public.app_client_save_week_idea(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Owners set the switch through the link row they already manage
-- ---------------------------------------------------------------------------

comment on table public.app_project_client_access
is 'One row per client per project, carrying the milestone-edit switch. Revoking sets revoked_at and takes effect on the next request, because every read and every write rechecks it.';

-- ---------------------------------------------------------------------------
-- Creating the account cannot depend on app metadata arriving in time
-- ---------------------------------------------------------------------------

-- The previous migration keyed the signup trigger on
-- raw_app_meta_data ->> 'role' = 'client'. Auth does not write app metadata in
-- the same statement as the row: it inserts the user and sets the metadata
-- afterwards, so the trigger saw no role, fell through to the email branch and
-- created an internal app_profiles row -- a member -- for every client an
-- owner shared a project with. The metadata is right by the time anyone looks,
-- which is what made it hard to see.
--
-- So the decision moves to something that is already true before the account
-- exists. An owner writes the address down here first; the trigger reads this
-- table, which cannot arrive late.

create table if not exists public.app_client_registrations (
  email text primary key check (position('@' in email) > 1),
  full_name text not null default '',
  created_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.app_client_registrations
is 'Addresses an owner is about to create a client account for. Read by the signup trigger and deleted the moment it fires, so a row here is never more than a few seconds old in normal use.';

alter table public.app_client_registrations enable row level security;

create policy "client_registrations_owner" on public.app_client_registrations
  for select to authenticated using ((select private.is_owner()));
create policy "client_registrations_owner_insert" on public.app_client_registrations
  for insert to authenticated with check ((select private.is_owner()));
create policy "client_registrations_owner_delete" on public.app_client_registrations
  for delete to authenticated using ((select private.is_owner()));

revoke all on public.app_client_registrations from public, anon;
grant select, insert, delete on public.app_client_registrations to authenticated;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.app_user_role;
  provider text;
  address text := lower(btrim(coalesce(new.email, '')));
  pending_name text;
  is_client boolean;
begin
  requested_role := new.raw_app_meta_data ->> 'role';
  provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  -- A registration older than a day is treated as abandoned, so a row left
  -- behind by a failed share cannot quietly turn a future internal account
  -- into a client months later.
  select registration.full_name into pending_name
  from public.app_client_registrations registration
  where registration.email = address
    and registration.created_at > now() - interval '1 day';

  is_client := found or requested_role = 'client';

  delete from public.app_client_registrations registration
  where registration.email = address;

  if is_client then
    insert into public.app_client_users (id, email, full_name)
    values (
      new.id,
      address,
      coalesce(
        nullif(btrim(coalesce(pending_name, '')), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        split_part(address, '@', 1)
      )
    )
    on conflict (id) do nothing;
    return new;
  end if;

  -- Nothing but email/password provisions an internal account. If an OAuth
  -- provider is ever switched on, a stranger signing in lands here and gets no
  -- account of any kind rather than becoming a member.
  if provider <> 'email' then
    return new;
  end if;

  safe_role := case
    when requested_role in ('owner', 'member', 'finance') then requested_role::public.app_user_role
    else 'member'::public.app_user_role
  end;

  insert into public.app_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    safe_role
  );
  return new;
end;
$$;
