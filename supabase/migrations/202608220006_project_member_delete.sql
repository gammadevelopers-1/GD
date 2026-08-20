-- Removing someone from a project becomes a delete rather than an archive.
--
-- The archived_at columns stay on the table. They still carry the history of
-- every removal made while archiving was the behaviour, and dropping them would
-- destroy that record to save nothing. They simply stop being written.
--
-- Nothing references app_project_members, so the row can go without leaving a
-- dangling id anywhere. The one thing that does need care is app_projects.lead_id,
-- which points at a profile rather than at a membership: the application clears
-- it before deleting so a project cannot keep a lead who is no longer on it.

create policy "project_members_owner_delete" on public.app_project_members
  for delete to authenticated
  using ((select private.is_owner()));

grant delete on public.app_project_members to authenticated;
