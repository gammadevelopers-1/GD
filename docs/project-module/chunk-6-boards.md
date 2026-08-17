# Milestone boards — supersedes Chunk 6

Each week is now two boards.

- **Idea Board** — rich blocks. What we are thinking of doing this week.
- **Work Board** — what actually happened, in sequence: in progress, blocked,
  completed, and not-completed at the bottom.

## What this changes from the approved plan

Three decisions in the original brief no longer hold. They were changed on
request; they are written down here because the earlier documents still say the
opposite.

| Was | Is now |
| --- | --- |
| Milestone items are a one-line label, done or not done | Cards carry headings, text, bullets, callouts, images, attachments and credential links |
| An item can be assigned to a project member | No assignee. The board records **what** was done, not **who** did it |
| "Plan milestone weeks and items — Owner: Yes, Member: No"; members could only toggle done | Owners **and the project lead of that project** author the boards. Everyone else with project access reads |
| Chunk 6 excluded Kanban columns and states | Cards move between two boards and four work states |

Week planning itself did **not** change: creating, editing and archiving weeks
is still owner-only.

Project lead used to be "a responsibility, not another permission role". It now
grants authorship on that one project — and nothing else. It still confers no
access to money, members or credentials.

## Data

`app_milestone_cards` replaces `app_milestone_items`. The old table is kept as
history with its write grants revoked, so nothing was deleted and only one
system is live. Existing items migrated: done → Work Board (completed),
not-done → Idea Board.

Content lives in `blocks jsonb`. The database only checks it is an array; the
shape is owned by `lib/projects/blocks.ts`, which validates server-side before
any write.

Check constraints carry the rules that matter:

- board and status must agree — an Idea card is always `idea`
- `blocked` requires a blocker
- `completed` requires a completion timestamp, and nothing else may have one

## Reasons are preserved

- **Blocked** cards must state the blocker, and it is kept after the card is
  unblocked or finished. The history of what got in the way survives.
- **Not completed** cards keep why. Carrying one into another week moves it to
  that week's Idea Board with the reason intact and a pointer back to the week
  it came from.

## Permissions

`private.can_manage_project(project)` — owner anywhere, or the active lead of
that project. Reading still follows `can_work_on_project`.

Movement runs through security-definer functions so a move is one atomic step:
`app_set_milestone_card_status`, `app_reorder_milestone_cards`,
`app_carry_milestone_card`.

## Attachments

Private bucket `app-project-attachments`, 10MB, path `<project>/<card>/<file>`.
The storage policies read the project id out of the first path segment, so that
shape is load-bearing. Reading follows project access; writing follows board
authorship. Images and documents only.

## Credentials on a board

A credential block stores an **id and a name — never a value**. It is a link to
the vault, where the grant is still checked and the copy is still audited.

Block text is run through the same `looksLikeSecret` detector the technical tab
uses, so a pasted key is rejected with a message pointing at Credentials. The
board cannot become a way around the vault.

## AI

Optional, and never on the critical path. One action today: **Suggest order**,
which sequences a week's ideas by dependency.

It reuses the pattern already proven by the public audit — Responses API,
`strict: true` JSON schema, `store: false`. If the model returns anything other
than exactly the ids it was given, nothing moves. With no `OPENAI_API_KEY` the
button reports that AI is not configured and every other board workflow is
unaffected.

## Notifications

Dropping the assignee left milestone reminders with nobody to address, so they
now go to the **project lead**. `app_notification_digest` and
`app_project_portfolio` both aggregate cards; without that change they would
have quietly frozen against a table that no longer receives writes.

## Verified

- `npm run check`, `npm run build`
- `npm run test:db` — 170 assertions
- `npm run test:api` — 56 checks, including that a member who is **not** the
  lead can read the board but cannot add, move or patch a card

## Still needs a person

- [ ] Owners confirm the three reversed decisions above
- [ ] Keyboard and screen-reader pass over the block editor
- [ ] Phone pass on the two-column board layout
- [ ] Decide whether members should regain any authorship
