# Chunk 4 — Project Overview

Anyone with access to a project should be able to explain its state from the
Overview tab alone, without opening the other three.

## What this chunk adds

- **A project header** carrying client, name, description, lead, team size, due
  date and milestone progress, with the status control and Edit button for
  owners. It scrolls properly at phone width.
- **A delivery signal** calculated from real milestone data: unfinished items in
  past weeks first, then the due date. Nobody selects it and nobody can
  override it.
- **The active milestone week** summarised inline — its items, who they belong
  to, and how many are done — with a link into the Milestones tab.
- **An owner-only value card** showing the recorded amount, both PKR and USD,
  the rate used and the date it was booked.
- **"Worth completing" prompts** when the description, dates, lead, team or
  milestone plan are missing, each linking to the place that fixes it.
- **Notices** after creating or restoring a project, so an action that navigates
  somewhere else still confirms itself.

No migration. Everything the Overview needs was already readable under the
Chunk 1 policies; `data/project-detail.ts` reads it in one place and derives the
rest.

## How the delivery signal is decided

In order, first match wins:

| Condition | Signal |
| --- | --- |
| Status is Paused or Closed | Paused / Closed |
| Any unfinished item in a week that is already due | `N overdue` |
| No milestone weeks planned | No plan yet |
| Due date has passed | Past due date |
| Otherwise | On track |

"Overdue" therefore means *work* is late, not that a date passed. A project
with a distant deadline and two forgotten items from three weeks ago reads as
behind, which is the honest answer.

The current week is the week containing today. If planning has not reached
today, it is the next week due; if every week is in the past, it is the last
one — so the question "which week are we in" always has an answer.

## Decisions to confirm with the owners

1. **Missing information is shown as an action, not as blank fields.** An
   incomplete project should look incomplete and say what to do about it.
2. **Members see the same operational summary as owners**, minus the value card.
   Nothing about money reaches the member response at all.
3. **The value card shows both currencies at all times**, converted from the
   stored amount and the rate recorded on the booking date.

## Verification

```bash
npx supabase db reset
npm run test:db
npm run test:api
npm run check && npm run build
```

Chunk 4 is a read surface, so its guarantees are the ones already proven by the
database and API suites: no member response contains a money field, and no
member can reach a project they are not assigned to.

## Manual role checks

### Owner

- Open **Meridian Loyalty Programme** in the demo data. It has no description,
  dates, lead, team or milestones — all five prompts should appear, each
  linking somewhere useful.
- Open **Northstar Operations Platform**. The signal should read `1 overdue`,
  the current week should be Week 4, and the week summary should match the
  Milestones tab.
- Open **Brightline Marketing Site**. Every week is in the past, so the summary
  shows the last week and the signal reads `4 overdue`.
- Check the value card: amount in its own currency, both totals, rate and
  booking date.
- Open **Atlas Client Portal** — no milestones planned, so the signal reads
  "No plan yet" rather than 0%.

### Assigned member

- The same project shows the same signal, week summary and progress.
- There is no value card, no Edit button and no status control.
- View the page source or the network response and search for the value. It is
  not there.

### Both

- At phone width, the header stacks and the four tabs scroll horizontally.

## Chunk 4 completion record

- Delivery signal approved by: ________________________
- Owner account tested by: ____________________________
- Member account tested by: ___________________________
- Mobile layout reviewed by: __________________________
- Remaining defects: __________________________________
