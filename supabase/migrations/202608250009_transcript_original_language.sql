-- Points are written in English so everyone on the board reads the same words,
-- but the words a client actually used are evidence. A decision made in Urdu is
-- easier to settle six weeks later by reading it back as it was said, so both
-- are kept on the row and the board offers a switch between them.
--
-- The script matters as much as the language. Speech recognition often returns
-- Pakistani Urdu as Devanagari, which reads as Hindi to the people who said it.
-- That is a transcription problem, not a storage one, so it is fixed where the
-- points are written rather than here; this migration only makes room for the
-- original alongside the translation.

alter table public.app_week_transcript_points
  add column if not exists original_body text
    check (original_body is null or length(original_body) <= 4000);

alter table public.app_week_transcript_points
  add column if not exists original_language text
    check (original_language is null or length(original_language) <= 40);

comment on column public.app_week_transcript_points.original_body
is 'The point in the language it was said in. Null when the source was already English.';

comment on column public.app_week_transcript_points.original_language
is 'That language named in English, for the switch on the board.';

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
      (transcript_id, position, at_seconds, speaker, body, tag,
       original_body, original_language)
    values (
      target_transcript_id,
      written,
      nullif(entry ->> 'at_seconds', '')::integer,
      nullif(btrim(coalesce(entry ->> 'speaker', '')), ''),
      left(body, 4000),
      nullif(btrim(coalesce(entry ->> 'tag', '')), ''),
      left(nullif(btrim(coalesce(entry ->> 'original_body', '')), ''), 4000),
      nullif(btrim(coalesce(entry ->> 'original_language', '')), '')
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

-- Organising rewrites the English wording, so it has to carry the original with
-- it or the pair would drift apart. A point organised before this migration has
-- no original yet; the caller supplies one and coalesce fills it in, while a
-- point that already has one keeps it — the original is what was said, and a
-- later tidy-up never changes that.
create or replace function public.app_organise_transcript_points(
  target_transcript_id uuid,
  updates jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry jsonb;
  touched integer := 0;
  point_id uuid;
  new_body text;
begin
  if not (select private.can_use_transcript(target_transcript_id)) then
    raise exception 'You cannot organise this transcript' using errcode = '42501';
  end if;

  if jsonb_typeof(updates) is distinct from 'array' then
    raise exception 'Those changes could not be read';
  end if;

  for entry in select * from jsonb_array_elements(updates) loop
    begin
      point_id := (entry ->> 'id')::uuid;
    exception when others then
      continue;
    end;

    new_body := btrim(coalesce(entry ->> 'body', ''));
    continue when new_body = '';

    update public.app_week_transcript_points
      set body = left(new_body, 4000),
          tag = nullif(btrim(coalesce(entry ->> 'tag', '')), ''),
          position = coalesce(nullif(entry ->> 'position', '')::integer, position),
          original_body = coalesce(
            original_body,
            left(nullif(btrim(coalesce(entry ->> 'original_body', '')), ''), 4000)
          ),
          original_language = coalesce(
            original_language,
            nullif(btrim(coalesce(entry ->> 'original_language', '')), '')
          )
    where id = point_id
      and transcript_id = target_transcript_id
      and archived_at is null;

    if found then
      touched := touched + 1;
    end if;
  end loop;

  return touched;
end;
$$;

revoke all on function public.app_organise_transcript_points(uuid, jsonb)
  from public, anon;
grant execute on function public.app_organise_transcript_points(uuid, jsonb)
  to authenticated;

comment on function public.app_organise_transcript_points(uuid, jsonb)
is 'Rewrites and reorders one source''s points in a single pass, filling in a missing original. Only touches points that belong to the named transcript.';
