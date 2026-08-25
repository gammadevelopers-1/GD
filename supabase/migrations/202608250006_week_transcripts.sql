-- The Idea Board used the empty space to its right for nothing. It now holds a
-- Transcript: the media a week was planned from, and the points pulled out of
-- it.
--
--   app_week_transcripts        — one row per source dropped on a week. The
--                                 file itself lives in a private bucket; only
--                                 the path is stored here.
--   app_week_transcript_points  — what the source said, in order, with the
--                                 second it was said at and who said it.
--
-- Both follow the week's own access rule, so a transcript is readable by
-- exactly the people who can already read the board it sits beside. Neither
-- table takes a write grant: every write goes through a definer function so
-- the guard is in one place and cannot be skipped by a direct PostgREST call.

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------

create table if not exists public.app_week_transcripts (
  id uuid primary key default gen_random_uuid(),
  milestone_week_id uuid not null
    references public.app_milestone_weeks(id) on delete restrict,
  kind text not null
    check (kind in ('video', 'audio', 'voice', 'pdf', 'doc', 'image')),
  name text not null check (btrim(name) <> '' and length(name) <= 200),
  storage_path text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  -- 'pending' the moment the file lands, so a half-finished transcription is
  -- visible as itself rather than as an empty transcript.
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed')),
  failure text,
  created_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists app_week_transcripts_week_idx
  on public.app_week_transcripts (milestone_week_id)
  where archived_at is null;

alter table public.app_week_transcripts enable row level security;

create policy "week_transcripts_select" on public.app_week_transcripts
  for select to authenticated
  using ((select private.can_use_week_board(milestone_week_id)));

revoke all on table public.app_week_transcripts from anon;
grant select on table public.app_week_transcripts to authenticated;

create trigger app_week_transcripts_updated
  before update on public.app_week_transcripts
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Points
-- ---------------------------------------------------------------------------

create table if not exists public.app_week_transcript_points (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null
    references public.app_week_transcripts(id) on delete restrict,
  position integer not null default 0,
  at_seconds integer check (at_seconds is null or at_seconds >= 0),
  speaker text check (speaker is null or length(speaker) <= 80),
  body text not null check (btrim(body) <> '' and length(body) <= 4000),
  tag text check (tag is null or length(tag) <= 40),
  -- The large sheet edits a TipTap document, the same editor as the board.
  -- Null until somebody opens the point and writes something longer.
  doc jsonb,
  -- Set when the point has been pushed to the Work Board, so the panel can
  -- show it as already sent instead of letting it be sent twice.
  card_id uuid references public.app_milestone_cards(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists app_week_transcript_points_transcript_idx
  on public.app_week_transcript_points (transcript_id, position)
  where archived_at is null;

create or replace function private.transcript_week(target_transcript_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select milestone_week_id
  from public.app_week_transcripts
  where id = target_transcript_id
$$;

revoke execute on function private.transcript_week(uuid) from public, anon;
grant execute on function private.transcript_week(uuid) to authenticated;

create or replace function private.can_use_transcript(target_transcript_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_use_week_board(
    (select private.transcript_week(target_transcript_id))
  ))
$$;

comment on function private.can_use_transcript(uuid)
is 'The transcript follows its week: owner anywhere, the project lead, or an assigned member.';

revoke execute on function private.can_use_transcript(uuid) from public, anon;
grant execute on function private.can_use_transcript(uuid) to authenticated;

create or replace function private.point_transcript(target_point_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select transcript_id
  from public.app_week_transcript_points
  where id = target_point_id
$$;

revoke execute on function private.point_transcript(uuid) from public, anon;
grant execute on function private.point_transcript(uuid) to authenticated;

alter table public.app_week_transcript_points enable row level security;

create policy "week_transcript_points_select" on public.app_week_transcript_points
  for select to authenticated
  using ((select private.can_use_transcript(transcript_id)));

revoke all on table public.app_week_transcript_points from anon;
grant select on table public.app_week_transcript_points to authenticated;

create trigger app_week_transcript_points_updated
  before update on public.app_week_transcript_points
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Writes
-- ---------------------------------------------------------------------------

create or replace function public.app_create_week_transcript(
  target_week_id uuid,
  new_kind text,
  new_name text,
  new_storage_path text,
  new_duration_seconds integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not (select private.can_use_week_board(target_week_id)) then
    raise exception 'You cannot add a source to this week' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.app_milestone_weeks week
    join public.app_projects project on project.id = week.project_id
    where week.id = target_week_id
      and (week.archived_at is not null or project.archived_at is not null)
  ) then
    raise exception 'This week is archived' using errcode = '42501';
  end if;

  insert into public.app_week_transcripts
    (milestone_week_id, kind, name, storage_path, duration_seconds, created_by)
  values
    (target_week_id, new_kind, btrim(new_name), new_storage_path,
     new_duration_seconds, (select auth.uid()))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.app_create_week_transcript(uuid, text, text, text, integer)
  from public, anon;
grant execute on function public.app_create_week_transcript(uuid, text, text, text, integer)
  to authenticated;

-- Replaces the whole point list for a source in one call. Transcription is one
-- shot: it either produced points or it did not, so a partial rewrite would
-- only ever leave a mix of two runs.
create or replace function public.app_record_transcript_points(
  target_transcript_id uuid,
  new_points jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry jsonb;
  written integer := 0;
  body text;
begin
  if not (select private.can_use_transcript(target_transcript_id)) then
    raise exception 'You cannot write to this transcript' using errcode = '42501';
  end if;

  if jsonb_typeof(new_points) is distinct from 'array' then
    raise exception 'Those points could not be read';
  end if;

  if jsonb_array_length(new_points) > 200 then
    raise exception 'That is more than 200 points in one transcript';
  end if;

  update public.app_week_transcript_points
    set archived_at = now()
  where transcript_id = target_transcript_id
    and archived_at is null
    and card_id is null;

  for entry in select * from jsonb_array_elements(new_points) loop
    body := btrim(coalesce(entry ->> 'body', ''));
    continue when body = '';

    insert into public.app_week_transcript_points
      (transcript_id, position, at_seconds, speaker, body, tag)
    values (
      target_transcript_id,
      written,
      nullif(entry ->> 'at_seconds', '')::integer,
      nullif(btrim(coalesce(entry ->> 'speaker', '')), ''),
      left(body, 4000),
      nullif(btrim(coalesce(entry ->> 'tag', '')), '')
    );

    written := written + 1;
  end loop;

  update public.app_week_transcripts
    set status = case when written > 0 then 'ready' else 'failed' end,
        failure = case when written > 0 then null
                       else 'Nothing could be pulled out of that file.' end
  where id = target_transcript_id;

  return written;
end;
$$;

revoke all on function public.app_record_transcript_points(uuid, jsonb) from public, anon;
grant execute on function public.app_record_transcript_points(uuid, jsonb) to authenticated;

create or replace function public.app_fail_week_transcript(
  target_transcript_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.can_use_transcript(target_transcript_id)) then
    raise exception 'You cannot write to this transcript' using errcode = '42501';
  end if;

  update public.app_week_transcripts
    set status = 'failed',
        failure = left(btrim(coalesce(reason, 'That file could not be read.')), 300)
  where id = target_transcript_id;
end;
$$;

revoke all on function public.app_fail_week_transcript(uuid, text) from public, anon;
grant execute on function public.app_fail_week_transcript(uuid, text) to authenticated;

create or replace function public.app_update_transcript_point(
  target_point_id uuid,
  new_body text,
  new_speaker text default null,
  new_tag text default null,
  new_doc jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(new_body, ''));
begin
  if not (select private.can_use_transcript(
    (select private.point_transcript(target_point_id))
  )) then
    raise exception 'You cannot edit this point' using errcode = '42501';
  end if;

  if clean = '' then
    raise exception 'A point needs something in it';
  end if;

  if new_doc is not null
     and (jsonb_typeof(new_doc) is distinct from 'object'
          or new_doc ->> 'type' is distinct from 'doc') then
    raise exception 'That is not a document';
  end if;

  if new_doc is not null and pg_column_size(new_doc) > 2000000 then
    raise exception 'That note is too large to save';
  end if;

  update public.app_week_transcript_points
    set body = left(clean, 4000),
        speaker = nullif(btrim(coalesce(new_speaker, '')), ''),
        tag = nullif(btrim(coalesce(new_tag, '')), ''),
        doc = coalesce(new_doc, doc)
  where id = target_point_id
    and archived_at is null;
end;
$$;

revoke all on function public.app_update_transcript_point(uuid, text, text, text, jsonb)
  from public, anon;
grant execute on function public.app_update_transcript_point(uuid, text, text, text, jsonb)
  to authenticated;

create or replace function public.app_archive_transcript_point(target_point_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.can_use_transcript(
    (select private.point_transcript(target_point_id))
  )) then
    raise exception 'You cannot remove this point' using errcode = '42501';
  end if;

  update public.app_week_transcript_points
    set archived_at = now()
  where id = target_point_id
    and archived_at is null;
end;
$$;

revoke all on function public.app_archive_transcript_point(uuid) from public, anon;
grant execute on function public.app_archive_transcript_point(uuid) to authenticated;

create or replace function public.app_archive_week_transcript(target_transcript_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.can_use_transcript(target_transcript_id)) then
    raise exception 'You cannot remove this source' using errcode = '42501';
  end if;

  update public.app_week_transcript_points
    set archived_at = now()
  where transcript_id = target_transcript_id
    and archived_at is null;

  update public.app_week_transcripts
    set archived_at = now()
  where id = target_transcript_id
    and archived_at is null;
end;
$$;

revoke all on function public.app_archive_week_transcript(uuid) from public, anon;
grant execute on function public.app_archive_week_transcript(uuid) to authenticated;

-- Sending a point to the Work Board writes a real card and remembers which one,
-- so the panel can show the point as sent and a second press cannot duplicate it.
create or replace function public.app_send_point_to_work_board(target_point_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found record;
  week_id uuid;
  next_position integer;
  new_card_id uuid;
begin
  select p.id, p.body, p.card_id, t.milestone_week_id
    into found
  from public.app_week_transcript_points p
  join public.app_week_transcripts t on t.id = p.transcript_id
  where p.id = target_point_id
    and p.archived_at is null;

  if found.id is null then
    raise exception 'That point could not be found';
  end if;

  week_id := found.milestone_week_id;

  if not (select private.can_use_week_board(week_id)) then
    raise exception 'You cannot add to this Work Board' using errcode = '42501';
  end if;

  if found.card_id is not null then
    return found.card_id;
  end if;

  select coalesce(max(position) + 1, 0) into next_position
  from public.app_milestone_cards
  where milestone_week_id = week_id
    and board = 'work'
    and archived_at is null;

  -- 'incomplete', not 'idea': the board/status constraint allows a work card
  -- only in_progress, blocked, completed or incomplete, and a point that has
  -- just arrived is none of the first three.
  insert into public.app_milestone_cards
    (milestone_week_id, board, status, title, blocks, position, created_by)
  values
    (week_id, 'work', 'incomplete', left(found.body, 200), '[]'::jsonb,
     next_position, (select auth.uid()))
  returning id into new_card_id;

  update public.app_week_transcript_points
    set card_id = new_card_id
  where id = target_point_id;

  return new_card_id;
end;
$$;

revoke all on function public.app_send_point_to_work_board(uuid) from public, anon;
grant execute on function public.app_send_point_to_work_board(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Media bucket
-- ---------------------------------------------------------------------------
-- 25 MB is the transcriber's own hard limit, so the bucket refuses what the
-- next step could not have read anyway.

insert into storage.buckets (id, name, public, file_size_limit)
values ('app-week-media', 'app-week-media', false, 26214400)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

-- Paths are <project_id>/<week_id>/<file>, so both read and write resolve
-- through the project in the first segment.
create policy "week_media_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'app-week-media'
    and (select private.can_work_on_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

create policy "week_media_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'app-week-media'
    and (select private.can_work_on_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

create policy "week_media_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'app-week-media'
    and (select private.can_work_on_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  )
  with check (
    bucket_id = 'app-week-media'
    and (select private.can_work_on_project(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

comment on table public.app_week_transcripts
is 'Media a week was planned from. The file is in the private app-week-media bucket; this row holds the path.';

comment on table public.app_week_transcript_points
is 'What a source said, in order. Written only by app_record_transcript_points.';
