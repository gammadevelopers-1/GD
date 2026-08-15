# Chunk 2 — Project portfolio

The screen that answers **"what is the state of every project right now?"**

Chunk 1 built the permission floor. This chunk is the first screen that stands on
it. Nothing here bypasses that floor: every rule is enforced in the database and
proved by tests that never touch the interface.

---

## 1. What was built

### The portfolio read

A single authorized database function, `app_project_portfolio`, returns each
project with its delivery state already calculated:

| Returned | Meaning |
| --- | --- |
| name, client, status, lead, start and due dates | The identity of the engagement |
| `total_items` / `done_items` | Overall milestone progress |
| `overdue_items` | Unfinished items in weeks whose due date has passed |
| `current_week_number` + its own done/total | The week containing today |
| `member_count` | Active assignments only |

It accepts search, status, client and person filters, so filtering happens in the
database rather than by fetching everything and hiding rows.

**There is no project-value column in the result.** Value is not selected and
then stripped — the query never reads the financial table. Owners get value from
a separate owner-only request against `app_project_financials`, which members
cannot execute at all.

Two smaller functions, `app_portfolio_clients` and `app_portfolio_people`, supply
the filter dropdowns. They only list clients and colleagues that appear on
projects the caller can already see — a member's Person filter cannot be used to
discover who else works at Gamma.

### The screen

- Search by project or client name, debounced, matching either field.
- Status filter as toggle chips across all seven statuses.
- Client and Person dropdowns.
- Owner-only **Archived** toggle.
- Every filter is stored in the URL, so a view can be bookmarked, refreshed and
  shared. A **Reset** action appears only when something is filtered, and says
  how many filters it will clear.
- Card grid and a dense table view, switchable on large screens. Below `lg` it is
  always cards — the table→cards pattern is decided once here and reused.
- Loading skeleton, empty portfolio, and no-filter-results states are all
  distinct and worded differently.
- A filter-aware summary strip: in delivery, with overdue work, due within 14
  days, paused or closed.
- Every card and row links to that project's workspace.

Owner and member versions differ in wording, in the value column, in the New
project button and in the archived toggle — not in the security, which is applied
underneath either way.

Status wording and colour now come from one shared module
(`lib/projects/status.ts`), so the dashboard, the portfolio and the project
workspace can no longer drift apart.

### Overdue is derived, never entered

A project is behind because unfinished items sit in past weeks — not because
somebody selected a health label. `deliverySignal` reads only real milestone
data.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `supabase/migrations/202608150001_project_portfolio.sql` | Portfolio + filter-option functions, grants |
| `supabase/tests/project_portfolio.test.sql` | 33 database permission and behaviour tests |
| `scripts/portfolio-api-check.mjs` | 19 direct HTTP API checks for every role (`npm run test:api`) |
| `data/portfolio.ts` | Server read, owner-only value merge |
| `lib/projects/status.ts` | The seven statuses, labels and colours, in one place |
| `lib/projects/format.ts` | Dates, money, deadline and delivery signals |
| `lib/projects/portfolio-query.ts` | URL filter parsing and validation |
| `components/admin/projects/portfolio-filters.tsx` | The filter bar |
| `components/admin/projects/portfolio-results.tsx` | Cards, table, summary, empty states |
| `components/admin/projects/portfolio-skeleton.tsx` | Loading state |
| `app/(admin)/projects/page.tsx`, `loading.tsx` | The screen |

---

## 3. Two defects found in Chunk 1, and fixed here

**Nobody could sign in locally.** `supabase/config.toml` had
`[auth.email] enable_signup = false`. That flag is the email *provider* switch,
not a signup switch — it disabled email/password sign-in entirely, so every
owner-created account was locked out of the local stack. Public self-signup is
closed by `[auth] enable_signup = false`, which was already set and is untouched.

**Creating an account with a role does not set the role.** Supabase writes custom
`app_metadata` *after* inserting the auth user, so the profile trigger has always
already defaulted the new account to `member`. Setting the platform role is a
second step on `app_profiles` today. Worth knowing before the People module
builds an invite flow — nothing in this chunk depends on it.

---

## 4. Verify it locally

```bash
npx supabase start
npx supabase db reset      # applies all three migrations
npm run test:db            # 63 database assertions across chunks 1 and 2
npm run test:api           # 19 direct HTTP checks, every role
npm run check              # lint + typecheck
npm run build
```

`test:api` creates its own accounts and data, exercises the real HTTP API with
real access tokens, and removes everything afterwards. It refuses to run against
anything that is not a local Supabase URL.

### Demo accounts for clicking around

Create these in Studio (`http://127.0.0.1:54323` → Authentication → Add user,
**Auto Confirm User** on), then run `supabase/dev-seed.sql` in the SQL editor:

- `ghulam.owner@example.com`
- `hamna.member@example.com`

For the full permission demo, add two more and wire them up:

```sql
-- after creating bilal.unassigned@example.com and finance@example.com
update public.app_profiles set role = 'finance'
where id = (select id from auth.users where email = 'finance@example.com');

update public.app_profiles set role = 'member', full_name = 'Bilal Unassigned'
where id = (select id from auth.users where email = 'bilal.unassigned@example.com');
```

Then `npm run dev` with the local Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$(npx supabase status -o env | grep '^PUBLISHABLE_KEY' | cut -d'"' -f2) \
npm run dev
```

---

## 5. Manual testing — do this before committing

Automated tests cover permissions. These cover the things only a person notices.

### As an owner

- [ ] `/projects` lists every active project with client, status, lead, dates and
      progress.
- [ ] Type part of a project name — the list narrows, and the URL gains `?q=`.
- [ ] Type part of a *client* name — it still matches.
- [ ] Toggle two statuses. Both apply together, and the URL shows them.
- [ ] Pick a client, then a person. Filters combine.
- [ ] **Refresh the browser.** Every filter survives.
- [ ] Copy the URL into a new tab. Same view.
- [ ] Press browser Back. The filter bar follows the URL, including the search box.
- [ ] Reset clears everything and says how many filters it cleared.
- [ ] Switch to table view, then reload — the view choice persists.
- [ ] Turn on **Archived**. Archived projects appear with a badge and sort last.
- [ ] Project value appears on owner cards and in the table's Value column.
- [ ] A project with an unfinished item in a past week shows a red "N overdue".
- [ ] A project with no milestone weeks shows "No plan yet", not a broken 0%.
- [ ] Paused and closed projects are still findable, but visually receded.
- [ ] Click any card and any table row — both open the right project.
- [ ] Filter to something that cannot match ("zzzz") — the empty state offers a
      reset, and is clearly different from the never-had-projects empty state.

### As an assigned member

- [ ] Only assigned projects appear, with member wording.
- [ ] **No project value anywhere** — no card chip, no Value column.
- [ ] No New project button, no Archived toggle.
- [ ] The Person dropdown lists only colleagues from their own projects.
- [ ] The Client dropdown lists only their own clients.
- [ ] Paste an owner-only project URL into the address bar — access is refused.
- [ ] Open DevTools → Network, reload, and read the `app_project_portfolio`
      response body. Confirm with your eyes that no value or amount field exists.

### As an unassigned member and as finance

- [ ] Unassigned member: empty portfolio, no error page.
- [ ] Finance: `/projects` is refused entirely.

### Mobile — do this on a real phone, not just a narrow window

- [ ] Cards, never a sideways-scrolling table.
- [ ] The filter bar stacks and stays usable; dropdowns are tappable.
- [ ] The page never scrolls horizontally.

### Keyboard and states

- [ ] Tab through the filter bar — every control shows a visible focus ring.
- [ ] Cards and rows are reachable by keyboard and show focus.
- [ ] Changing a filter shows the skeleton, not a frozen or blank list.

---

## 6. Pushing to Supabase

The migration is **additive**: it creates three functions and grants. It creates,
alters and drops no table, and changes no existing policy. Rolling back means
dropping the three functions.

The CLI on this machine is not authenticated, so this is your step:

```bash
npx supabase login
npx supabase link --project-ref tlfouzavoodmvgutfrio

npx supabase migration list --linked   # confirm chunks 1 and 2 line up
npx supabase db push --dry-run         # read what it will run
npx supabase db push
```

Then, in the Supabase dashboard for the hosted project:

1. **Authentication → Sign In / Providers → Email** must stay *enabled*, and
   **Allow new users to sign up** must stay *off*. That combination is what the
   config fix above mirrors locally.
2. Re-run the owner and member checks from section 5 against the hosted project.
3. Confirm the marketing site still builds and loads — the shared deploy means a
   bad push takes both down.

Push to staging first if the linked project is production. Take a backup, or
confirm point-in-time recovery, before touching production.

---

## 7. Owner demo script

Run it in this order — it is the plan's Chunk 2 demonstration:

1. Filter by status, then client, then person.
2. Refresh the browser; show the filters survive.
3. Open a project from the portfolio.
4. Side by side: the owner portfolio and the same member's portfolio.
5. Open DevTools on the member session and show the response has no value field.
6. Show the mobile card layout on a phone.
7. Run `npm run test:db` and `npm run test:api` on screen — 82 assertions, no UI.

---

## 8. Decisions needed from the owners

1. **Default view.** The plan's written spec says a denser layout on large
   screens; the mockup shows a card grid. Both are built and switchable — confirm
   which should be the default. It is currently the card grid.
2. **Archived toggle.** Owners can reveal archived projects from the portfolio.
   Chunk 3 adds archive and restore themselves. Confirm the toggle belongs here.
3. **Pagination.** Not built. At Gamma's project count the full list is faster to
   scan than a pager. Confirm, or it goes in the backlog.

---

## 9. Completion gate

| Gate | Status |
| --- | --- |
| Owners can identify active, paused, overdue and upcoming work from this screen | Ready for owner review |
| Members receive only assigned projects | Proved by database and API tests |
| Project value does not appear in member network responses | Proved by database and API tests |
| Loading, empty and no-results states | Built |
| Desktop and mobile layouts | Needs the manual pass in section 5 |

Sign-off record:

- Scope confirmed by: ______________________
- Migration reviewed by: ___________________
- `npm run test:db` run by: ________________
- `npm run test:api` run by: _______________
- Owner account tested by: _________________
- Member account tested by: ________________
- Mobile checked by: _______________________
- Staging accepted by: _____________________
- Remaining defects: _______________________

Do not start Chunk 3 until the owners accept this demonstration.
