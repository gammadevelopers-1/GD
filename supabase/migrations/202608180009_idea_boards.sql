-- The Idea Board replaces the milestones workspace: one long-form document per
-- project. Milestone weeks and cards stay exactly as they are; the board reads
-- them to suggest unfinished work, and never writes to them.

create or replace function private.can_use_idea_board(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_work_on_project(target_project_id))
    or (select private.can_manage_project(target_project_id))
$$;

comment on function private.can_use_idea_board(uuid)
is 'Owner anywhere, the project lead, or an assigned member. The people who may write on a project board.';

revoke execute on function private.can_use_idea_board(uuid) from public, anon;
grant execute on function private.can_use_idea_board(uuid) to authenticated;

create table public.app_project_idea_boards (
  project_id uuid primary key references public.app_projects(id) on delete restrict,
  doc jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  updated_by uuid references public.app_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_project_idea_boards enable row level security;

create policy "idea_boards_select" on public.app_project_idea_boards
  for select to authenticated
  using ((select private.can_use_idea_board(project_id)));

-- Reads follow the policy above. Writes are never granted directly: they go
-- through app_save_idea_board, so the archived-project rule and the payload
-- cap live in one place.
revoke all on table public.app_project_idea_boards from anon;
grant select on table public.app_project_idea_boards to authenticated;

create trigger app_project_idea_boards_updated
  before update on public.app_project_idea_boards
  for each row execute function private.set_updated_at();

create function public.app_save_idea_board(
  target_project_id uuid,
  new_doc jsonb
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
    raise exception 'You cannot edit this project''s idea board';
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

  insert into public.app_project_idea_boards (project_id, doc, updated_by)
  values (target_project_id, new_doc, (select auth.uid()))
  on conflict (project_id) do update
    set doc = excluded.doc,
        updated_by = excluded.updated_by
  returning updated_at into saved_at;

  return saved_at;
end;
$$;

revoke all on function public.app_save_idea_board(uuid, jsonb) from public, anon;
grant execute on function public.app_save_idea_board(uuid, jsonb) to authenticated;

-- Board attachments live beside the existing card attachments, under an
-- ideas/ prefix. The card policies only let an owner or lead write; assigned
-- members write here too, so this prefix gets its own pair of policies.
create policy "idea_attachments_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'app-project-attachments'
    and name like '%/ideas/%'
    and (select private.can_use_idea_board(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );

create policy "idea_attachments_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'app-project-attachments'
    and name like '%/ideas/%'
    and (select private.can_use_idea_board(
      nullif(split_part(name, '/', 1), '')::uuid
    ))
  );
