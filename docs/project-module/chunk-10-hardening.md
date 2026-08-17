# Chunk 10 — Hardening and rollout

Verify the whole module, put every real project in it, and make it dependable
enough that people stop asking in WhatsApp.

Half of this chunk is code. The other half is a person sitting with the thing
and checking, which is why the release check prints both.

## What this chunk adds

- **`npm run release:check`** — runs every gate a machine can settle (lint,
  types, production build, database policy tests for every role, direct API
  tests for every role, credential encryption round trip), then prints the
  checks that need a person.
- **An unexpected-error state** for the whole admin group,
  [app/(admin)/error.tsx](<../../app/(admin)/error.tsx>). It shows Next's error
  digest as a reference and never the message — a query that failed while
  reading credentials is exactly the wrong thing to print on a screen.
- **Low-volume notifications**: milestone due, milestone overdue, credential
  access, owner summary.
- **`supabase/pilot-readiness.sql`** — every active project and what is still
  missing from it. This is the "confirm each active project has…" list, as a
  query rather than a checklist someone has to eyeball.

## Notifications

Four, and no more. An internal tool that emails constantly gets filtered
within a fortnight, and then the important ones get missed too.

| Notification | When | To |
| --- | --- | --- |
| Milestone due | Item unfinished, week due within the horizon | The assignee |
| Milestone overdue | Item unfinished, week already past | The assignee |
| Credential access | An owner grants access | The recipient (Chunk 9) |
| Owner summary | Weekly | Owners |

Due and overdue arrive as **one** email per person, not two — someone with
three slipped items and two upcoming gets a single message, which is the
difference between a useful nudge and noise.

### How the sender reaches the data

A scheduled job has no signed-in user, and the service key deliberately has no
read privilege on any internal table — Chunk 1 revoked it and it is worth
keeping. So the sender gets exactly one function,
`app_notification_digest(horizon_days)`, executable only by `service_role`,
returning what is due, what has slipped, and who to tell. No project values, no
credentials.

```bash
curl -X POST "$SITE/api/notifications?kind=milestones" \
  -H "x-notification-secret: $NOTIFICATIONS_CRON_SECRET"
```

`kind` is `milestones`, `summary` or `all`. The endpoint answers with counts
only — never addresses, never contents.

Suggested schedule: `milestones` on weekday mornings, `summary` on Mondays.

```
RESEND_API_KEY=…
NOTIFICATIONS_FROM="Gamma Developers <platform@gammadevelopers.ai>"
NOTIFICATIONS_CRON_SECRET=…
SUPABASE_SECRET_KEY=…
```

Without them the endpoint returns 503 and sends nothing, rather than failing
quietly. **Verify SPF, DKIM and DMARC on the domain before switching this on** —
mail that lands in spam is worse than no mail, because people stop trusting all
of it.

## Accessibility and motion

Already handled globally, verified rather than rebuilt:

- **Reduced motion** — `app/globals.css` neutralises animation and transition
  durations under `prefers-reduced-motion: reduce`, with extra handling for the
  button fill and spotlight effects. `useReducedMotion` covers the scripted
  ones.
- **Focus** — every interactive element uses the shared `FOCUS_RING` tokens
  from `lib/admin-ui.ts`, so focus is visible on every tab without per-screen
  decisions.
- **Labels** — icon-only controls (copy, revoke, archive, dismiss) carry
  `aria-label`s naming what they act on, so "Archive" alone is never what a
  screen reader announces.

Still needs a person: a keyboard-only pass and a screen-reader pass over the
project workspace. Both are on the release check's manual list.

## States

Loading, empty, no-filter-results, validation, denied, not-found and
unexpected-error all exist across the module. The credential vault adds two
more worth knowing about: **no encryption key configured** (the vault closes
and says so) and **a value encrypted with a key version that is no longer in
the ring** (it names the version rather than failing vaguely).

## Loading real data

1. `psql "$DATABASE_URL" -f supabase/pilot-readiness.sql`
2. Work down the `missing` column until it is empty for every active project.
3. Re-run it. This is the completeness gate, and it is a query so nobody has to
   remember the list.

## Release checks

```bash
npm run release:check
```

- [ ] No critical or high-risk security defect remains
- [ ] No member can retrieve project value — *automated*
- [ ] No user can retrieve an unassigned project — *automated*
- [ ] Revocation works for project and credential access — *automated*
- [ ] All key workflows work on a phone
- [ ] Owners can understand the state of the business from current project data
- [ ] The team knows where to report issues after launch

## After launch

Hamna owns this. The realistic risk is not a bug, it is that internal tools
have no paying client demanding attention, so they rot: something breaks,
nobody has time, people work around it, and six months later everyone is back
in spreadsheets.

What prevents that is small and regular rather than heroic — a standing slot
for it, and owners reporting problems instead of tolerating them. Keep a
post-launch backlog from real usage, and treat the Chunk 8 friction log as its
first entries.

## Chunk 10 completion record

- Release check run by: ______________________________
- All active projects loaded and verified by: ________
- Keyboard and screen-reader pass by: _________________
- Phone pass by: ______________________________________
- Email domain verified (SPF, DKIM, DMARC) by: ________
- Notification schedule live from: ____________________
- Owner acceptance: ___________________________________
- Maintenance owner confirmed: ________________________
- Post-launch backlog started: ________________________
