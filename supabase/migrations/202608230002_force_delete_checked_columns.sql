create or replace function private.repoint_profile_references(target uuid, heir uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref record;
begin
  for ref in
    select
      cls.relname as table_name,
      att.attname as column_name,
      (
        att.attnotnull
        or exists (
          select 1
          from pg_constraint chk
          where chk.conrelid = con.conrelid
            and chk.contype = 'c'
            and att.attnum = any (chk.conkey)
        )
      ) as keep_value
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.app_profiles'::regclass
      and nsp.nspname = 'public'
      and array_length(con.conkey, 1) = 1
    order by cls.relname, att.attname
  loop
    if ref.keep_value then
      execute format(
        'update public.%I set %I = $1 where %I = $2',
        ref.table_name, ref.column_name, ref.column_name
      ) using heir, target;
    else
      execute format(
        'update public.%I set %I = null where %I = $1',
        ref.table_name, ref.column_name, ref.column_name
      ) using target;
    end if;
  end loop;
end;
$$;

comment on function private.repoint_profile_references(uuid, uuid)
is 'Clears every foreign key that points at one profile. A column is reassigned to the heir when it is required or when a check constraint couples it to another column, and nulled otherwise.';

revoke all on function private.repoint_profile_references(uuid, uuid) from public, anon, authenticated;
