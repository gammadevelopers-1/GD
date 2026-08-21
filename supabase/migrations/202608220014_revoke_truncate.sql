-- Taking TRUNCATE away from anon and authenticated.
--
-- Supabase grants arwdDxtm -- everything, TRUNCATE included -- to anon and
-- authenticated on every table created in public, through default privileges
-- owned by supabase_admin and postgres. Every migration since the foundation has
-- revoked what it cared about: DELETE went, per "archive, never delete", and the
-- app_ tables were revoked from anon wholesale. TRUNCATE was never named, so it
-- stayed behind on all 24 tables.
--
-- That matters more than it looks. TRUNCATE is not filtered by row level
-- security -- policies simply do not apply to it -- so the one privilege that
-- ignores every rule this platform is built on outlived the one that does not.
-- And "authenticated" is not only staff: a client portal account holds exactly
-- that role. The tables reachable this way included app_profiles,
-- app_employment_private, app_project_financials and app_audit_logs, the last of
-- which is the record that makes anything here defensible after the fact.
--
-- Nothing is known to have exploited it. PostgREST exposes no TRUNCATE verb, so
-- the Data API could not reach it, and neither role holds CREATE on public, so
-- no trigger or function could be defined to carry it. This closes it as a
-- matter of not leaving a loaded privilege lying next to the data.
--
-- REFERENCES and TRIGGER go with it. Neither is reachable today for the same
-- reason, and neither is any use to a client of this platform.

revoke truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

-- Future tables start without it, so the next migration does not have to
-- remember.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
