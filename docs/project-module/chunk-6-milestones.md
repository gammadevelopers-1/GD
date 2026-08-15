# Chunk 6 — Weekly milestones

Deliberately the plainest planning system we could build: a sequence of weeks,
each holding a handful of things that should be done by the end of it, and each
item either done or not done.

## What this chunk adds

- **Plan a week** — week number, optional start date, due date. The next number
  is suggested.
- **Edit or archive a week**, and restore an archived one.
- **Add, edit and remove items**, each with an optional assignee from the
  project team.
- **Tick items off.** Completion records who did it and when; un-ticking clears
  that again.
- The week containing today is highlighted; unfinished items in past weeks show
  the week as overdue.
- Per-week counts and a progress bar, feeding the project-level progress and
  the portfolio's overdue signal.
- Empty states before planning begins, and week cards that stack on a phone.

## Deliberately excluded

No sub-tasks. No priorities. No dependencies. No Kanban columns. No
drag-and-drop. No separate task list. If a project genuinely needs those, that
is a signal to use a real project tool rather than to grow this one.

## Decisions to confirm with the owners

1. **Owners plan, members complete.** A member can change done/not-done and
   nothing else — not a label, not an assignee, not a date.

   This is enforced in an unusual way worth understanding. Chunk 1 revoked the
   `UPDATE` privilege on milestone items from *every* signed-in user, so no
   policy mistake can ever expose those columns. That means owners cannot edit
   items directly either, so owner edits go through two authorized functions
   (`app_save_milestone_item`, `app_set_milestone_item_archived`) that check
   ownership themselves. It is a little more code in exchange for a guarantee
   that does not depend on a policy staying correct.

2. **An item can only be assigned to someone on the project team.** Enforced by
   a database trigger. Completing an item still works after its assignee leaves
   the project — the check only runs when the assignee changes, so removing
   somebody never freezes their unfinished work.

3. **Archiving a week frees its number.** The original constraint covered
   archived weeks too, so archiving Week 3 made "3" unusable forever. It is now
   a partial unique index over live weeks only.

4. **Archived weeks and items count for nothing** — not progress, not overdue,
   and an archived week never becomes the current week.

## Verification

```bash
npx supabase db reset
npm run test:db
npm run test:api
npm run check && npm run build
```

The suite proves a member cannot plan a week, add an item, rewrite an item
through the RPC, patch the table directly, or move a week's dates — and that
they *can* still tick an item off.

## Manual role checks

### Owner

- Open **Northstar Operations Platform**. Week 4 is the current week; Week 2
  has an unfinished item from the past, so the project reads as overdue.
- Plan Week 6, then try to plan Week 4 again: it tells you the number is taken.
- Archive a week, then plan a new week with the same number — allowed.
- Show the archived Week 5 and restore it.
- Show the two removed items on Week 4 and restore one.
- Edit an item's label and assignee. Try assigning someone not on the team by
  removing them from Team first — the item form only offers the current team.
- Set a week's due date before its start date. Expect a message, no save.

### Assigned member

- Tick an item, refresh, confirm it stuck and shows against your name.
- No add, edit, archive or plan controls anywhere on the tab.
- The header line reads "Tick items off as you finish them."

### Both

- At phone width, weeks stack and each card stays readable.

## Chunk 6 completion record

- Planning workflow approved by: ______________________
- Migration reviewed by: ______________________________
- Database and API tests run by: ______________________
- Owner account tested by: ____________________________
- Member account tested by: ___________________________
- Remaining defects: __________________________________
