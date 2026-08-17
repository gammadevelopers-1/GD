# Chunk 7 — Non-sensitive technical details

Everything a newly assigned person needs to start work on Monday morning,
without asking in WhatsApp or scrolling back through three months of chat.

The table and its policies already existed from Chunk 1. This chunk adds the
write path, the guard rails, and the tab people actually use.

## What this chunk adds

- **Working links** — repository, hosting or Vercel project, live domain,
  staging domain, design file. Each one copies to the clipboard in a click and
  opens in a new tab.
- **Client technical contact** — who to ask on their side.
- **Stack notes and onboarding notes** — what this is built with, and what a new
  person needs on day one.
- **Owners and assigned members both edit.** This is the one part of the project
  workspace a member can change beyond ticking a milestone off.
- **A readiness meter** showing how much of the tab is filled in, so an empty
  project looks unfinished rather than looking fine.
- **Clear "not added" states** that double as the affordance to add the thing.
- Empty, error, archived and read-only states. Cards stack on a phone.

## The secret guard

The single most important thing in this chunk is what it *refuses* to store.

Nothing on this tab is encrypted, nothing is audited, and everyone on the
project can read it. So a database trigger rejects anything credential-shaped
before it is ever written:

- private key blocks (`-----BEGIN … PRIVATE KEY-----`)
- database and broker connection strings (`postgres://`, `mongodb+srv://`, …)
- any URL carrying `user:password@`
- provider-shaped tokens — `sk-…`, `sk_live_…`, `ghp_…`, `github_pat_…`,
  `xox[bap]-…`, `AKIA…`, `AIza…`, `sbp_…`
- JSON web tokens, which is what a Supabase service key looks like
- `password = …`, `api_key: …`, `client_secret = …` and friends, where a value
  actually follows

It is deliberately eager. A false positive costs somebody one retype; a false
negative puts a live client key somewhere with no encryption and no audit trail.
The same patterns are mirrored in `lib/projects/technical.ts` so the form can
say so before submitting, but the database is what enforces it.

Those values belong in Chunk 9's vault, and the tab says so where people will
be tempted to paste them.

## Decisions to confirm with the owners

1. **Assigned members may edit non-sensitive details.** This is decision 3 in
   §12 of the module plan. If the owners want these read-only for members,
   change `private.can_work_on_project` to `private.is_owner` in
   `app_save_technical_details` and the tab's edit button disappears on its own.

2. **The RPC is the only write path.** As with milestone items, `INSERT` and
   `UPDATE` on `app_project_technical_details` are revoked from every signed-in
   user, so no policy mistake can expose the table. Writes go through
   `app_save_technical_details`, which re-checks membership itself. The insert
   and update policies stay in place as a second line of defence.

3. **Links are restricted to http and https.** Stored values are parsed before
   being rendered, so nothing here can ever become a `javascript:` or `data:`
   link. A bare domain (`gammadevelopers.ai`) is accepted for the two domain
   fields and rendered as `https://`.

4. **Archived projects are read-only.** Restore the project first.

5. **The last person to save is recorded** in `updated_by` and shown on the tab.
   Not an audit log — just enough to know who to ask.

## Verification

```bash
npx supabase migration up --local   # or: npx supabase db reset
npm run test:db
npm run test:api
npm run check && npm run build
```

`supabase/tests/project_technical_details.test.sql` adds 20 tests: owner and
member can save, unassigned member and finance cannot read or write, anonymous
has no privilege on the table at all, a removed member loses access on the next
request, direct table writes are refused, and each class of secret is rejected.

## Manual role checks

### Owner

- Open a project → **Technical**. Fill in every field, save, reload.
- Copy the repository link with the copy button and paste it somewhere.
- Paste `postgresql://admin:hunter2@db.example.com:5432/app` into the repository
  field. Expect a refusal that names the field and points at Credentials.
- Paste a Supabase service key into stack notes. Same refusal.
- Enter `not a url` in the repository field. Expect a shape message, no save.
- Clear a field and save — it goes back to "Not added".
- Archive the project, reopen the tab: read-only, with a reason.

### Assigned member

- Open the same project. Every link is there, and **Edit details** is available.
- Update the stack notes. The tab records you as the last person to save.
- Try the same secret paste as above. Same refusal.

### Unassigned member and finance

- Open `/projects/<id>?tab=technical` by URL. Expect the not-found path, not an
  empty tab.
- Hit the API directly as each of them — `app_project_technical_details` returns
  nothing and `app_save_technical_details` refuses.

### Both

- At phone width, link cards stack one per row and stay tappable.

## Chunk 7 completion record

- Member-editing decision confirmed by: _______________
- Migration reviewed by: ______________________________
- Database and API tests run by: ______________________
- Owner account tested by: ____________________________
- Assigned member account tested by: __________________
- Unassigned member and finance tested by: ____________
- Remaining defects: __________________________________
