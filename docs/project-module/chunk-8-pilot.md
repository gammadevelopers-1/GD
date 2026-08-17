# Chunk 8 — Core workspace pilot

This chunk is not a build. Nothing here ships a feature.

It is the week where one real Gamma project stops living in WhatsApp and starts
living in the platform, so that we find out what is actually wrong with Chunks
2–7 while the cost of fixing it is still low — and, critically, **before any
client credential is ever stored in this system.**

Chunk 9 does not start until this one closes.

## Why it exists

Everything up to here was demonstrated with test accounts and seeded data. That
proves the permissions work. It does not prove anyone will use it.

The failure mode for internal tools is not a bug. It is a team that quietly
keeps using WhatsApp because the tool asks for two more clicks than they have
patience for. That only shows up under real use, and the plan's completion gate
is written accordingly: *"the team agrees that credential work may begin."*

## Choosing the project

Pick one active project with an owner, a named lead, and a team actually working
on it this week. Not the calmest one — a normal one. A project with no pressure
will not surface anything.

Avoid a project that is nearly finished; there will be no milestone activity to
observe.

## Setting it up

Enter the real thing, not a sketch:

- Client, description, status, start and due dates
- The real team, each with what they are actually doing on it
- The project lead
- Owner-only value, currency, rate and booking date
- Milestone weeks from the start of the project to at least two weeks ahead,
  with real items, assigned to real people, ticked to reflect reality *today*
- Every technical link that exists, plus stack and onboarding notes

`supabase/pilot-readiness.sql` lists what is still missing on every active
project. Run it once at setup and again at the end of the pilot.

Then announce the rule to the team: **for this project, project status questions
get answered from the platform.** Someone who asks in WhatsApp gets pointed at
the link rather than an answer.

## Running it — one week minimum

The pilot is calendar time, not build time. A day proves nothing; people are
still being polite about it. A week is the shortest span in which somebody
forgets to tick something, a milestone slips, and a new person needs a repo URL.

During the week:

- Owners open the portfolio instead of asking for an update
- The lead keeps the milestone plan honest — this is the habit being tested
- Everyone else ticks their own items as they finish them
- Anything confusing goes in the friction log the same day, not from memory
  afterwards

## Questions the pilot must answer

Write the answer down, with the evidence, not an impression:

1. Can the owner understand project status without asking the team?
2. Can the team identify current and overdue work?
3. Can a newly assigned person find the technical information they need?
4. Does removing a person actually remove access?
5. Are people updating milestone completion naturally, or only when reminded?
6. Is any essential project information still being kept only in WhatsApp?

Question 4 is worth staging deliberately rather than waiting for it to happen:
add someone to the project, let them confirm they can see it, remove them, and
have them try the same URL and an API call. That is also a Chunk 5 regression
test run against real data.

Question 6 is the one that decides whether this module worked.

## Handling what comes up

Split everything in the friction log into exactly two piles:

- **Defects** — something that prevents normal use, contradicts the permission
  contract, or makes a screen wrong. Fixed inside this chunk.
- **Requests** — something that would be nice, or that someone is used to from
  another tool. Goes to the post-launch backlog, untouched.

The rule from §8 of the module plan: *put feature requests that are outside the
approved scope into a later backlog instead of expanding the active chunk.*
The most likely requests are comments on a project, file attachments, a Kanban
view and time tracking. All four are on the explicitly excluded list. They stay
excluded until someone is doing that job by hand and complaining about it.

Any permission defect is a stop-the-line issue. It is fixed and re-tested before
the chunk closes, and it means the direct API tests from Chunk 1 get another
run.

## Completion gate

- [ ] The selected project is managed from the platform, not from chat
- [ ] Owners and assigned members approve the core workflow
- [ ] Every defect found is fixed, or explicitly accepted by the owners
- [ ] No unresolved permission defect remains
- [ ] All six questions above have written answers
- [ ] `supabase/pilot-readiness.sql` reports nothing missing on the pilot project
- [ ] The team agrees that credential work may begin

That last box is the one that unlocks Chunk 9. Before ticking it, confirm the
two names §11 of the plan requires and Chunk 9 cannot start without: the
**credential encryption-key owner** and a **separate security reviewer**.

## Chunk 8 completion record

- Pilot project: ______________________________________
- Ran from ____________________ to ____________________
- Owner sign-off: _____________________________________
- Lead sign-off: ______________________________________
- Member sign-off: ____________________________________
- Defects found / fixed: ______ / ______
- Requests moved to backlog: __________________________
- Encryption-key owner named: _________________________
- Security reviewer named: ____________________________
