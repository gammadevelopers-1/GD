-- Chunk 8 / Chunk 10 — what is still missing on every active project.
--
-- Run it in the Supabase SQL editor, or:
--   psql "$DATABASE_URL" -f supabase/pilot-readiness.sql
--
-- Read-only. It runs as an admin and so ignores row-level security on purpose:
-- it is a completeness check on the data, not a permission check. Permissions
-- are tested in supabase/tests/ and scripts/project-api-check.mjs.
--
-- "Ready" means the project answers the questions the module promised to
-- answer: what is it, who owns it, who is on it, what is due this week, and
-- where does a new person start.

with counts as (
  select
    project.id as project_id,
    (select count(*) from public.app_project_members member
      where member.project_id = project.id
        and member.archived_at is null) as team_size,
    (select count(*) from public.app_milestone_weeks week
      where week.project_id = project.id
        and week.archived_at is null) as weeks,
    (select count(*) from public.app_milestone_items item
      join public.app_milestone_weeks week on week.id = item.milestone_week_id
      where week.project_id = project.id
        and week.archived_at is null
        and item.archived_at is null) as items,
    (select count(*) from public.app_milestone_items item
      join public.app_milestone_weeks week on week.id = item.milestone_week_id
      where week.project_id = project.id
        and week.archived_at is null
        and item.archived_at is null
        and item.is_done = false
        and week.due_on < current_date) as overdue_items
  from public.app_projects project
),
readiness as (
  select
    project.name as project,
    client.name as client,
    project.status,
    coalesce(lead.full_name, '—') as lead,
    counts.team_size,
    counts.weeks as milestone_weeks,
    counts.overdue_items,
    array_remove(array[
      case when project.description is null or btrim(project.description) = ''
        then 'description' end,
      case when project.lead_id is null then 'lead' end,
      case when project.starts_on is null then 'start date' end,
      case when project.due_on is null then 'due date' end,
      case when counts.team_size = 0 then 'team' end,
      case when counts.weeks = 0 then 'milestone weeks' end,
      case when counts.items = 0 then 'milestone items' end,
      case when money.project_id is null then 'project value' end,
      case when technical.repository_url is null then 'repository' end,
      case when coalesce(technical.hosting_url, technical.live_domain) is null
        then 'hosting or live domain' end,
      case when technical.design_url is null then 'design file' end,
      case when technical.technical_contact is null then 'technical contact' end,
      case when technical.stack_notes is null then 'stack notes' end,
      case when technical.onboarding_notes is null then 'onboarding notes' end
    ], null) as missing
  from public.app_projects project
  join public.app_clients client on client.id = project.client_id
  left join public.app_profiles lead on lead.id = project.lead_id
  left join counts on counts.project_id = project.id
  left join public.app_project_technical_details technical
    on technical.project_id = project.id
  left join public.app_project_financials money
    on money.project_id = project.id
  where project.archived_at is null
    and project.status not in ('closed', 'paused')
)
select
  project,
  client,
  status,
  lead,
  team_size,
  milestone_weeks,
  overdue_items,
  cardinality(missing) as gaps,
  missing
from readiness
order by gaps desc, project;
