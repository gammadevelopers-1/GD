-- Putting an address next to the name in the credential audit.
--
-- The log answers "who opened which secret, when". A name alone is thin when the
-- question is being asked seriously, so the entry now carries the address the
-- request came from as well, and the screen resolves the person's email beside
-- it. Everything else about the log is unchanged: still append-only, still
-- owner-only to read, still written by the same seven functions.
--
-- Two things worth being honest about.
--
-- First, this only ever describes events from here on. Every row written before
-- this migration has a null ip and the screen says so rather than guessing.
--
-- Second, an IP is only as trustworthy as whoever set the header. The value is
-- read from x-gamma-client-ip, which lib/supabase/server.ts sets from the
-- address Next.js saw -- behind Vercel that is the platform's own view of the
-- caller and is worth having. Someone calling PostgREST directly with their own
-- token could send whatever they liked in that header, exactly as they could
-- forge x-forwarded-for. So this is evidence about traffic through the app, not
-- proof against a determined authenticated caller. It is recorded because it
-- makes the ordinary case legible, not because it is unforgeable.
--
-- Note also what is deliberately not being changed: lib/audit/rate-limit.ts
-- still hashes addresses for sign-in throttling, and the client sign-in table
-- still stores only that hash. This column is scoped to the credential audit.

alter table public.app_audit_logs
  add column if not exists ip text;

comment on column public.app_audit_logs.ip
is 'Address the request came from, as reported by the application. Null for every event recorded before this column existed, and forgeable by a caller who bypasses the app, so treat it as a lead rather than proof.';

create or replace function private.record_credential_event(
  target_credential_id uuid,
  action_name text,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.app_audit_logs
    (actor_id, action, resource_type, resource_id, metadata, ip)
  values (
    (select auth.uid()),
    action_name,
    'credential',
    target_credential_id,
    coalesce(event_metadata, '{}'::jsonb),
    nullif(
      btrim(
        split_part(
          coalesce(
            (
              nullif(current_setting('request.headers', true), '')::json
                ->> 'x-gamma-client-ip'
            ),
            ''
          ),
          ',',
          1
        )
      ),
      ''
    )
  )
$$;
