-- Sharing a project failed at the first step with "permission denied for table
-- app_client_registrations". The application writes the pending address with an
-- upsert, and PostgREST compiles an upsert into insert ... on conflict do
-- update. Postgres checks for the update privilege when it plans that statement,
-- not when a row actually conflicts, so the very first share was rejected even
-- though nothing was being overwritten.
--
-- The table was already owner-only for select, insert and delete. Update joins
-- them on the same terms rather than the application giving up an atomic write
-- and doing delete-then-insert, which would open a window where two owners
-- sharing the same address at once leave no row at all.

create policy "client_registrations_owner_update" on public.app_client_registrations
  for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()));

grant update on public.app_client_registrations to authenticated;
