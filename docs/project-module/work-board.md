# Idea Board and Work Board — the project workspace

The Milestone tab is one workspace with two modes of the same document.

- **Idea Board** — capture. Free writing, notes, pasted material, images,
  video, PDFs and files.
- **Work Board** — organise. The Idea Board reorganised by AI into a plan,
  then edited by hand like any other document.

The Work Board opens *over* the Idea Board from a tab on the right edge, and
the arrow at the top left goes back. Nothing navigates; both editors stay
mounted, so switching costs nothing and loses no unsaved text.

## What changed

| Was | Is now |
| --- | --- |
| One Idea Board document per project | Two documents per project, same shape, same permissions |
| Suggestions occupied a permanent right rail | Suggestions are a panel opened from the Idea Board header, closed by default |
| The tab content sat inside the page scroll | The workspace fills the viewport; only the document scrolls |
| The project header showed banner, description and four metrics | On this tab only, the header collapses to name, client, status and tabs |

## Data

`app_project_work_boards` mirrors `app_project_idea_boards` exactly:
one row per project, a `doc jsonb`, and no direct write grant. Writes go
through `app_save_work_board(project_id, doc, mark_generated)`, which repeats
the idea board's three checks — permission, archived project, 2 MB cap — so
neither board can drift from the other.

`generated_at` / `generated_by` record that the AI produced a revision. A hand
edit leaves them alone (`coalesce` on conflict), so they always answer "when
was this last generated", not "when was it last touched".

### Permissions

No new permission concept. Both boards select through
`private.can_use_idea_board(project_id)` — owner anywhere, the project lead,
or an assigned member. Removing someone from the project removes both boards
with the same query that already removed one.

Attachments reuse the `<projectId>/ideas/` storage prefix, so the existing
`idea_attachments_select` / `idea_attachments_insert` policies cover Work Board
uploads too. No new bucket, no new storage policy.

### Validation

Both boards are parsed by `parseIdeaDoc` before saving. That means the Work
Board inherits the node whitelist, the link scheme check, the palette
restriction, the attachment path rule and the `looksLikeSecret` guard. An AI
plan that repeated a key back would be refused exactly as a typed one is.

## Organising with AI

`organiseWorkBoard(projectId, mode)`:

1. Flattens the **saved** Idea Board to plain text (`ideaDocToText`), capped at
   14 000 characters. Attachments become `[image attached: name]` so the model
   knows they exist without being told what is in them.
2. Sends it to the Responses API under a strict `json_schema` of
   sections → items/notes, plus a `facts` list restricted to Owner, Deadline,
   Decision, Dependency and Priority.
3. Builds the TipTap document **server-side** from that JSON. The model never
   emits editor JSON, so it cannot inject a node type the parser would reject.

Action items become a task list, so the plan is tickable. Notes become bullets.

The prompt's first rule is that it invents nothing: no task, deadline, owner,
priority, requirement, decision or dependency that is not written in the notes.
An empty `facts` list is a correct answer. Anything unclear keeps its original
wording under the nearest heading.

Generation is only ever a button press. Editing the Idea Board never triggers
it.

### Regenerating

The first run fills an empty board. Any later run asks first: **Replace** the
board, or **Append below** it after a divider. Hand edits are never discarded
without that choice.

On failure nothing is written — the Idea Board is untouched and any existing
Work Board is left exactly as it was. The error names the cause (no credits,
rejected key, unknown model, timeout, notes too long) and the button stays
available for a retry.

## Saving

Both boards autosave on the shared 1200 ms debounce, showing
`Saving…` → `Saved`, and `Retry` on failure with the text kept in the editor.
Leaving the tab flushes; leaving the page while dirty warns.

Before organising, the Idea Board is force-saved and the result awaited — the
server reads notes from the database, so an unsaved sentence would otherwise be
missing from the plan.

## Suggestions

Unchanged in substance: unfinished cards from past milestone weeks, newest week
first, derived by `unfinishedByWeek` from data the page already fetches. Each
row shows the title, status chip, week, due date, and — expanded — the blocker
or carry reason and who added it.

There is still no write path to milestone cards, so this reflects pre-existing
data only. `MilestoneCard` carries no assignee field, so suggestions cannot show
one, and there is no card route to link to.

## Files

| Path | Role |
| --- | --- |
| `supabase/migrations/202608190001_work_boards.sql` | Table, RLS, save RPC |
| `data/work-board.ts` | Read for the page |
| `app/(admin)/projects/work-actions.ts` | Save and organise actions |
| `lib/projects/idea-text.ts` | Document → plain text for the prompt |
| `lib/projects/work-ai.ts` | Schema, prompt, JSON → TipTap |
| `components/admin/projects/project-workspace.tsx` | Mode switch, transition, AI controls |
| `components/admin/projects/board-surface.tsx` | One board: header, attach, editor |
| `components/admin/projects/use-board-doc.ts` | Autosave wiring per board |
| `components/admin/projects/suggestions-panel.tsx` | Unfinished-work panel |

`components/admin/projects/idea-board.tsx` was replaced by these and deleted.
The dead milestone modules (`boards-panel.tsx`, `block-editor.tsx`,
`block-view.tsx`, `rich-editor.tsx`, `board-actions.ts`, `milestone-actions.ts`)
are untouched — they are still the only write path for the data suggestions
read.

## Environment

`OPENAI_API_KEY` and optionally `OPENAI_MODEL`, already in `.env.example`.
Without a key the Work Board still works as a normal document; the
**Organise with AI** button is not rendered rather than shown disabled.

---

# Weekly planning (2026-08-19)

The Milestone tab now answers three questions in one place, in this order:

| Layer | Question |
| --- | --- |
| Week rail | **When** are we doing the work? |
| Idea Board | **What** are we thinking? |
| Work Board | **How** does that become actionable? |

The week rail sits above both boards and stays visible when the Work Board
slides over the Idea Board, so the weeks frame both rather than being a fourth
place to look.

## The rail

One row of week chips, horizontally scrollable, scrolled to the current week on
open. Each chip carries a state pip and, when the week holds work, a `done/total`
count. Four states, derived — never entered by hand:

| State | Derived from |
| --- | --- |
| Complete | `completed_at` is set |
| Overdue | not complete, past due, unfinished work remains |
| Current | the week containing today, else the next upcoming week |
| Upcoming | everything else |

Selecting a chip opens one compact detail row: date range, state, focus, the
week's work items, and — for an owner or the project lead — **Mark complete**
and an inline focus field that saves on blur. Completed weeks stay in the rail
but read quietly; the current week is the only one with a green treatment.

Collapsing the rail (the **Weeks** toggle) hands the space back to the document.

## Data

Weekly planning adds three columns to the existing `app_milestone_weeks` —
`focus`, `completed_at`, `completed_by`. **No new task records.** The rail shows
the `app_milestone_cards` the project already has; it cannot create, edit or
delete them.

Two new RPCs, both guarded by `private.can_manage_project` (owner anywhere, or
the active lead on their own project):

- `app_set_milestone_week_complete(week_id, complete)`
- `app_set_milestone_week_focus(week_id, focus)`

Planning weeks themselves — add, renumber, redate, archive — is unchanged and
still owner-only through `milestone-actions.ts`, which the rail's **Add week**
control reuses rather than duplicating.

Closing a week has two knock-on effects, both intentional: it clears that week's
overdue signal, and it stops the Idea Board's Unfinished panel suggesting work
from it.

# Navigation performance

Overview → Milestone was slow because one query did everything.

`getProjectDetail` fetched the project, its members, its technical details,
**every milestone week, every card, and every card's `blocks` jsonb** — then the
page awaited all of it before rendering a single element. Nothing on the page
had rendered card blocks since the Idea Board replaced the card UI, so the
largest column in the payload was being fetched for nothing.

Three changes:

1. **`blocks` is no longer selected.** It was dead weight in every project load.
2. **Weeks moved out of the project query** into `getProjectWeeks(projectId, isOwner)`,
   wrapped in React's `cache()` so the several components that need it in one
   render share a single query. `getProjectDetail` is `cache()`d for the same
   reason — the page and its sections no longer re-query it.
3. **The shell no longer waits on week data.** The back link, project header and
   tabs render from the light query; the header's Milestones tile, the Overview
   panels and the workspace each stream in behind their own Suspense boundary
   with a skeleton that matches the real layout, including the week rail.

`cache()` is request-scoped memoisation, not a data cache: nothing is stored
between requests or shared between users, and the new direct query on
`app_milestone_weeks` is subject to the same row-level policies the nested query
was. The owner/member split still only widens what an owner may see (archived
weeks and cards); rows are gated by RLS either way.

The Overview's **Open Milestone** link is now `prefetch`ed.

---

# Rebuild: the week is the unit (2026-08-19)

The Milestone tab is now a stack of weeks. Everything belongs to a week; there
is no project-level board any more.

```
WEEKS                            0/1 closed · 50%   [+ Add week]
▾ Week 1  Apr 17 – Apr 23  ⚠ Overdue   1 undone   [Mark complete] [🗑]
    carried from Week 0 …                    [Accept] [×]
    ┌ Idea Board ─────────────── Saved ── [📎] [⤢] ┐
    │ rich text, 360px, scrolls inside            │
    │                              [Work Board 3] │
    └─────────────────────────────────────────────┘
▸ Week 2  Apr 24 – Apr 30                3 undone
```

## What each layer is

| Layer | Storage | Who writes |
| --- | --- | --- |
| Week row | `app_milestone_weeks` (+ `focus`, `completed_at`) | owner plans; owner/lead closes |
| Idea Board | `app_week_idea_boards` — one TipTap doc per week | owner, lead, assigned member |
| Work Board | `app_milestone_cards` on board `work` (+ `assigned_to`, `doc`) | owner/lead edit; anyone assigned ticks |

`private.can_use_week_board(week_id)` resolves the week's project and defers to
`can_use_idea_board`, so no new permission concept was introduced. Task content
stays behind `can_manage_project` and ticking behind `can_update_card_status` —
the split the platform already drew between authoring a plan and reporting on
it.

## Height, and why it matters

The idea board is a fixed 360px box that scrolls internally and never grows.
Expanding it to full screen toggles a class on the **same** element, so the
editor is never unmounted and nothing is lost on the way in or out. Escape
returns. That is what keeps Week 2 one short scroll below Week 1 no matter how
much has been written.

Only one week is open at a time. The open week is remembered per project in
`localStorage`, read through `useSyncExternalStore` so the first server render
and the first client render agree.

## Organize with AI

Reads that week's idea board, returns a proposed task list, and **never writes
to the board**. The proposal opens in a review step where each row can be
ticked, retitled and assigned before anything is created. Titles that already
resemble a task on the board are flagged `Already on board` and start unticked.
With an empty idea board the button is disabled and says so.

Matching is a plain normalise-and-compare in `lib/projects/week-ai.ts` — exact,
containment, or 70% overlap of significant words. No model call decides whether
something is a duplicate.

The prompt forbids inventing work, and explicitly forbids assigning anyone or
setting a date even when a name or a day appears in the notes — assignment is
the reviewer's decision, made in the review step.

## Carry-over

Unfinished work-board tasks from the previous week appear at the top of the next
week's panel as dashed `from Week N` suggestions. **Accept** calls the existing
`app_carry_milestone_card`, which moves the card and stamps
`carried_from_week_id`. **Dismiss** writes to `app_card_carry_dismissals` so it
stays gone. Suggestions are derived in `lib/projects/carry-over.ts` and skip
anything already titled the same on the target week.

## Cost note

`getProjectWeeks` deliberately does **not** select `app_milestone_cards.blocks`.
Task bodies live in the newer `doc` column; `blocks` is legacy and nothing on
this screen renders it.
