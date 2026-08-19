-- The Work Board is the organised twin of the Idea Board: same document shape,
-- same people, same storage prefix. It is written either by the AI organiser or
-- by hand, so it needs its own row and its own timestamps, but no new
-- permission concept -- can_use_idea_board already names exactly the people who
-- may work on a project board.

create table public.app_project_work_boards (
  project_id uuid primary key references public.app_projects(id) on delete restrict,
  doc jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  generated_at timestamptz,
  generated_by uuid references public.app_profiles(id) on delete restrict,
  updated_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_project_work_boards enable row level security;

create policy "work_boards_select" on public.app_project_work_boards
  for select to authenticated
  using ((select private.can_use_idea_board(project_id)));

-- Writes go through app_save_work_board only, so the archived-project rule and
-- the payload cap live in one place, exactly as they do for the idea board.
revoke all on table public.app_project_work_boards from anon;
grant select on table public.app_project_work_boards to authenticated;

create trigger app_project_work_boards_updated
  before update on public.app_project_work_boards
  for each row execute function private.set_updated_at();

create function public.app_save_work_board(
  target_project_id uuid,
  new_doc jsonb,
  mark_generated boolean default false
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_at timestamptz;
begin
  if not (select private.can_use_idea_board(target_project_id)) then
    raise exception 'You cannot edit this project''s work board';
  end if;

  if exists (
    select 1 from public.app_projects
    where id = target_project_id and archived_at is not null
  ) then
    raise exception 'This project is archived';
  end if;

  if jsonb_typeof(new_doc) is distinct from 'object'
     or new_doc ->> 'type' is distinct from 'doc' then
    raise exception 'That is not a document';
  end if;

  if pg_column_size(new_doc) > 2000000 then
    raise exception 'This board is too large to save';
  end if;

  insert into public.app_project_work_boards (
    project_id, doc, updated_by,
    generated_at, generated_by
  )
  values (
    target_project_id, new_doc, (select auth.uid()),
    case when mark_generated then now() end,
    case when mark_generated then (select auth.uid()) end
  )
  on conflict (project_id) do update
    set doc = excluded.doc,
        updated_by = excluded.updated_by,
        generated_at = coalesce(excluded.generated_at, public.app_project_work_boards.generated_at),
        generated_by = coalesce(excluded.generated_by, public.app_project_work_boards.generated_by)
  returning updated_at into saved_at;

  return saved_at;
end;
$$;

comment on function public.app_save_work_board(uuid, jsonb, boolean)
is 'Saves a project work board. mark_generated records that the AI organiser produced this revision.';

revoke all on function public.app_save_work_board(uuid, jsonb, boolean) from public, anon;
grant execute on function public.app_save_work_board(uuid, jsonb, boolean) to authenticated;
