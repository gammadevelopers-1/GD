begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

-- Supabase hands anon and authenticated every privilege on every new table in
-- public, so the question is never "was this granted" but "was it taken back".
-- TRUNCATE is the one that matters most: row level security does not apply to
-- it, and a client portal account holds the authenticated role.

select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee in ('anon', 'authenticated')
     and privilege_type = 'TRUNCATE'),
  0,
  'no table in public can be truncated by anon or authenticated'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee in ('anon', 'authenticated')
     and privilege_type in ('REFERENCES', 'TRIGGER')),
  0,
  'and neither role may attach triggers or foreign keys to them'
);

-- Deleting is allowed on exactly three tables, and archiving covers the rest.
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee = 'authenticated'
     and privilege_type = 'DELETE'),
  3,
  'delete stays limited to the three tables that opted into it'
);

select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false),
  0,
  'every table in public has row level security enabled'
);

-- A definer function without a pinned search_path can be redirected by whatever
-- the caller puts in front of it.
select is(
  (select count(*)::int from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where p.prosecdef
     and n.nspname in ('public', 'private')
     and not exists (
       select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
       where cfg like 'search_path=%'
     )),
  0,
  'every security definer function pins its search_path'
);

-- The audit log records where a request came from, and says so honestly when
-- it does not know.
select is(
  (select count(*)::int from information_schema.columns
   where table_schema = 'public'
     and table_name = 'app_audit_logs'
     and column_name = 'ip'),
  1,
  'the audit log has somewhere to put the address a request came from'
);

select * from finish();
rollback;
