-- Every audit a visitor runs. This is lead intelligence: which industries
-- actually land on the site, and what they say hurts.
--
-- No raw IPs. ip_hash is a salted SHA-256 prefix — enough to count uniques
-- and spot abuse, not enough to identify anyone.

create table if not exists public.audit_runs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  description   text not null,
  problems      text[],
  fixes         text[],
  headline      text,
  weeks         smallint,

  ip_hash       text not null,
  latency_ms    integer,
  cached        boolean not null default false,
  input_tokens  integer,
  output_tokens integer,
  error         text
);

create index if not exists audit_runs_created_at_idx on public.audit_runs (created_at desc);
create index if not exists audit_runs_ip_hash_idx    on public.audit_runs (ip_hash);

-- Writes happen with the service role key from the API route only.
-- RLS on with no policies means nothing is readable from the browser.
alter table public.audit_runs enable row level security;

-- Which industries are actually visiting, most recent first:
--   select description, headline, created_at
--   from audit_runs where error is null
--   order by created_at desc limit 50;