begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('d0000000-0000-4000-8000-000000000001', 'release-owner@example.test',
   '{"role":"authenticated"}', '{"full_name":"Release Owner"}', now(), now());

update public.app_profiles set role = 'owner'
where id = 'd0000000-0000-4000-8000-000000000001';

insert into public.app_client_registrations (email, full_name, created_by)
values ('reused@example.test', 'Reused Person',
        'd0000000-0000-4000-8000-000000000001');

insert into auth.users (
  id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('d0000000-0000-4000-8000-000000000002', 'reused@example.test',
   '{"role":"client"}', '{"full_name":"Reused Person"}', now(), now());

select is(
  (select count(*)::int from public.app_client_users
   where email = 'reused@example.test'),
  1, 'the client account exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.app_force_delete_client_account(
      'd0000000-0000-4000-8000-000000000002')$$,
  'an owner can delete the client account'
);

select is(
  (select count(*)::int from public.app_client_users
   where email = 'reused@example.test'),
  0, 'the client account is gone'
);

select is(
  (select count(*)::int from public.app_client_registrations
   where email = 'reused@example.test'),
  0, 'and the address is released, so it can become a team account'
);

-- An invite still in flight must keep blocking.
insert into public.app_client_registrations (email, full_name, created_by)
values ('pending@example.test', 'Pending Person',
        'd0000000-0000-4000-8000-000000000001');

select is(
  (select count(*)::int from public.app_client_registrations
   where email = 'pending@example.test'),
  1, 'a registration with no account yet still stands'
);

select is(
  (select count(*)::int from public.app_client_registrations
   where email = 'never-seen@example.test'),
  0, 'an unrelated address was never blocked'
);

select * from finish();
rollback;
