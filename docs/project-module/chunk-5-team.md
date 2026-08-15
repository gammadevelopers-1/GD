# Chunk 5 — Team and project access

The Team tab is the control for who can reach a project. It is not a directory
of names: adding someone here is the thing that grants access, and removing
them is the thing that takes it away.

## What this chunk adds

- The active team with each person's name and what they are doing on the
  project, and the lead marked.
- **Add someone** — an owner picks an active person and describes their part.
- **Edit a responsibility** inline.
- **Change the lead** from any team member, in one click.
- **Remove someone**, with a confirmation that says what will happen.
- **Restore a previous assignment** from a "Previously on this project" list,
  reusing the original record rather than creating a second one.
- Every add and remove is recorded against the owner who did it.

Migration: `supabase/migrations/202608150003_team_and_milestones.sql`.

## Decisions to confirm with the owners

1. **A deactivated person cannot be assigned or restored.** Enforced by a
   database trigger, so it holds no matter which code path writes the
   assignment. Someone deactivated *while* already on a project keeps the row
   for history but loses access immediately, which is the Chunk 1 behaviour.

2. **Removing the lead clears the lead field.** A lead who is not on the team
   would be a lead who cannot open their own project. The confirmation says so
   before you do it, and you are expected to pick a new lead afterwards.

3. **Removal archives, never deletes.** `archived_by` records who removed them
   alongside the existing `added_by`. Restoring reuses the same row, so
   re-adding somebody five times still leaves one record.

4. **Owners can see archived assignments; members cannot.** An owner needs to
   read a removed assignment in order to restore it. To a member, a removed
   colleague simply is not there.

## Waiting on Chunk 9

Removing someone from a project must also revoke their credential grants for
that project. There is no credentials table yet, so there is nothing to revoke.
The hook is commented in the migration next to the assignment rules — it
belongs there, not in a server action, so no future code path can skip it.
**This is a completion gate for Chunk 9, not an open defect in Chunk 5.**

## Verification

```bash
npx supabase db reset   # database tests assume a clean database
npm run test:db         # 118 assertions across four files
npm run test:api        # 32 direct API checks with real accounts
npm run check && npm run build
```

`supabase/tests/project_team_milestones.test.sql` proves that adding grants
access, removing revokes it on the next request, a removed member cannot read
the project or its assignment history, restoring does not duplicate, and a
deactivated person cannot be put back on a team.

## Manual role checks

### Owner

- Open **Cedar Analytics Launch** in the demo data. Abubakar appears under
  "Previously on this project" — restore him and he moves up into the team.
- Add someone, then sign in as them: the project is in their portfolio.
- Remove them again, refresh their window: it is gone, and opening the project
  URL directly fails.
- Give someone a responsibility, then edit it inline.
- Use **Make lead** on a non-lead. The crown moves; nobody gains access they
  did not already have.
- Remove the current lead. The confirmation warns you that the lead is being
  cleared too.

### Assigned member

- The Team tab is read-only: no Add panel, no Remove, no Make lead.
- The right-hand panel explains that owners manage access.

### Both

- At phone width, row actions stay visible rather than hiding behind hover.

## Chunk 5 completion record

- Team workflow approved by: __________________________
- Migration reviewed by: ______________________________
- Database and API tests run by: ______________________
- Add / remove / restore tested by: ___________________
- Member account tested by: ___________________________
- Remaining defects: __________________________________
