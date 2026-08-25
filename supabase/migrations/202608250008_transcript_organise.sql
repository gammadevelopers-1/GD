-- Transcript points arrive in the order they were said, which is rarely the
-- order they are useful in. "Organise with AI" rewrites them for clarity, gives
-- them consistent tags and puts related points together — the same treatment
-- the Work Board already gives tasks.
--
-- One call per source rather than one per point: the whole reshuffle is a
-- single decision, so a half-applied reordering would leave the list in a state
-- nobody asked for.

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
          position = coalesce(nullif(entry ->> 'position', '')::integer, position)
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
is 'Rewrites and reorders one source''s points in a single pass. Only touches points that belong to the named transcript.';
