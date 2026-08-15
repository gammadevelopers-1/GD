# Chunk 3 — Project lifecycle

Owners create and manage a project from discovery through closure without
opening Supabase. Members can do none of it.

## What this chunk adds

- **Create** at `/projects/new` — name, client, status, lead, start date, due
  date, description, and owner-only value.
- **Edit** at `/projects/[id]/edit` — every field above, on an existing project.
- **Status** changes from the project header, without opening the edit form.
- **Archive and restore**, with a confirmation step before archiving.
- **Server-side validation** with per-field messages. The browser's `required`
  and `type="date"` are conveniences; every rule is checked again on the server.
- **An audit entry** for create, update, status change, archive and restore.

Migration: `supabase/migrations/202608150002_project_lifecycle.sql`.

## Decisions to confirm with the owners

1. **The project lead is always on the project team.** A database trigger
   creates or restores the lead's assignment whenever `lead_id` is set. A lead
   who could not open their own project would be a bug, and the rule now holds
   no matter what writes the row.

2. **Replacing a lead does not remove the previous one.** They stay assigned
   until an owner removes them on the Team tab (Chunk 5). Silently revoking
   someone's access as a side effect of a different action is worse than
   leaving it to a deliberate step.

3. **A recorded project value can be corrected but not removed.** Same reason
   as archive-don't-delete. Clearing the field returns a validation message
   instead of quietly wiping the figure.

4. **`exchange_rate_to_pkr` is PKR per one USD on the booking date**, whatever
   currency the project is booked in. The amount, its currency and that rate
   are never rewritten; both totals are worked out at display time. Storing a
   rate of 1 for PKR projects would have made the USD column impossible.

5. **Closed and archived stay different.** Closed means delivery finished and
   the project is still visible. Archived removes it from normal views and
   revokes member access, and only an owner can bring it back.

6. **The audit log has exactly one write path.** `app_record_project_event` is
   owner-only, and the table still has no insert policy, so nothing else can
   append to it. Never put a secret in the metadata.

## Verification

```bash
npx supabase db reset   # database tests assume a clean database
npm run test:db         # 84 assertions across three files
npm run test:api        # 24 direct API checks, real accounts, real tokens
npm run check && npm run build
```

`supabase/tests/project_lifecycle.test.sql` covers the lead-membership trigger,
the date-order constraint, member write attempts, the audit rules, and access
disappearing and returning across archive and restore.

## Manual role checks

### Owner

- Create a project with only a name and client. It should be created, and the
  Overview should prompt for what is missing.
- Create a project with a due date before the start date. Expect a message on
  the due date field and no project created.
- Enter `abc` as the project value. Expect a message on that field only, with
  everything else you typed still in the form.
- Change the status from the project header. The portfolio should reflect it.
- Set a lead who is not yet on the team. Open the Team tab: they are there.
- Change the lead. The previous lead should still be on the team.
- Archive a project. It leaves the portfolio, and the **Archived** filter finds
  it again.
- Restore it. It returns with its milestones and team intact.

### Assigned member

- No New project button, no Edit button, no status control.
- Open `/projects/<id>/edit` directly. Expect the access-denied screen.
- While an owner archives a project you are on, refresh: it is gone from your
  portfolio, and opening its URL fails.

### Both

- Everything above on a phone-width window.

## Chunk 3 completion record

- Lifecycle decisions approved by: ____________________
- Migration reviewed by: ______________________________
- Database and API tests run by: ______________________
- Owner account tested by: ____________________________
- Member account tested by: ___________________________
- Remaining defects: __________________________________
