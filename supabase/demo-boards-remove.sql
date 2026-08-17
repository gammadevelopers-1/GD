-- Removes everything supabase/demo-boards-seed.sql created.
--
--   psql "$DATABASE_URL" -f supabase/demo-boards-remove.sql
--
-- Only touches the fixed dd0000…-prefixed demo ids, so real project data is
-- never in scope. Deletes rather than archives, because this is throwaway
-- demo data — the archive-don't-delete rule protects real history, not this.

begin;

delete from public.app_milestone_cards
where milestone_week_id in (
  'dd000000-0000-4000-8000-000000000011',
  'dd000000-0000-4000-8000-000000000012',
  'dd000000-0000-4000-8000-000000000013'
);

delete from public.app_milestone_weeks
where project_id = 'dd000000-0000-4000-8000-000000000002';

-- Any credentials that were added into the demo containers through the UI.
delete from public.app_credential_grants
where credential_id in (
  select id from public.app_project_credentials
  where project_id = 'dd000000-0000-4000-8000-000000000002'
);
delete from public.app_credential_secrets
where credential_id in (
  select id from public.app_project_credentials
  where project_id = 'dd000000-0000-4000-8000-000000000002'
);
delete from public.app_project_credentials
where project_id = 'dd000000-0000-4000-8000-000000000002';

delete from public.app_env_files
where project_id = 'dd000000-0000-4000-8000-000000000002';
delete from public.app_env_groups
where project_id = 'dd000000-0000-4000-8000-000000000002';

delete from public.app_project_technical_details
where project_id = 'dd000000-0000-4000-8000-000000000002';
delete from public.app_project_financials
where project_id = 'dd000000-0000-4000-8000-000000000002';
delete from public.app_project_members
where project_id = 'dd000000-0000-4000-8000-000000000002';

delete from public.app_audit_logs
where resource_id = 'dd000000-0000-4000-8000-000000000002';

delete from public.app_projects
where id = 'dd000000-0000-4000-8000-000000000002';
delete from public.app_clients
where id = 'dd000000-0000-4000-8000-000000000001';

commit;
