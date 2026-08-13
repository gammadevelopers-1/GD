# Chunk 1 — Setup, Decisions, and Verification

This checklist is the handoff for the Project module's permission and data
foundation. Complete it in staging before applying the migration to the live
Supabase project.

## What this chunk changes

- Treats only active, non-archived profiles as valid platform accounts.
- Treats only active, non-archived project assignments as project access.
- Keeps Finance out of the operational Projects workspace while preserving its
  access to finance records for the later Finance module.
- Keeps project values in the separate `app_project_financials` table.
- Blocks anonymous access to internal project tables.
- Prevents members from directly updating milestone labels, assignments, dates,
  or archive state.
- Adds a completion-only database function for assigned members.
- Adds direct database tests for Owner, assigned Member, unassigned Member,
  Finance, inactive Member, and anonymous access.
- Disables automatic seed execution. The existing demo seed remains opt-in and
  must never be run against a database containing real data.
- Disables open self-signup in the local Supabase configuration. Internal
  accounts are created by an owner/administrator, never by a public sign-up
  form.

## Owner decisions required

Record these decisions before signing off Chunk 1:

1. **Roles:** keep only Owner, Member, and Finance.
2. **Finance boundary:** Finance does not enter Projects; it reaches project
   money later through the Finance module.
3. **Project lead:** the lead is a project responsibility, not a fourth role.
4. **Access source:** an active project assignment is the only way a Member
   receives project access.
5. **Deactivation:** deactivating a profile removes project and document access
   immediately, even if assignments still exist for history.
6. **History:** records are archived and restored; normal application users do
   not permanently delete them.

Recommended answer for all six is **Approved as written** because it matches the
internal-platform brief and the detailed module plan.

## Required local tools

- Node.js and the repository dependencies from `npm install`.
- Docker Desktop or Docker Engine running locally. Supabase CLI uses containers
  for the local database and permission tests.
- Supabase CLI from the repository's existing `supabase` package.

Do not place the Supabase service-role key in a `NEXT_PUBLIC_` variable. The
application uses only the project URL and publishable key in the browser-facing
configuration.

## Local verification

From the repository root:

```bash
npm install
npx supabase start
npx supabase db reset
npm run test:db
npm run check
npm run build
```

`supabase db reset` applies all migrations to the disposable local database.
The database test creates its own temporary users and data inside a transaction,
then rolls everything back.

Expected database-test result: all tests in
`supabase/tests/project_access_rls.test.sql` pass.

## Optional demo data

The file `supabase/dev-seed.sql` is intentionally not executed automatically.
Use it only in an empty local or staging database:

1. Create `ghulam.owner@example.com` and `hamna.member@example.com` in Supabase
   Authentication.
2. Never reuse production passwords for these accounts.
3. Run `supabase/dev-seed.sql` through the local Studio SQL editor.
4. Confirm that its records contain `[DEMO]` in project and client names.
5. Never run the demo seed after real company data has been loaded.

## Application environment

Create `.env.local` without committing it:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Retrieve both values from Supabase **Connect**. Do not add a service-role key to
this file unless a future server-only feature explicitly requires it and its
handling has been reviewed.

## Staging migration procedure

The new migration is:

```text
supabase/migrations/202608130001_project_access_hardening.sql
```

Use the linked staging project first:

```bash
npx supabase migration list --linked
npx supabase db push --dry-run
npx supabase db push
```

After the push:

1. In Supabase Authentication settings, disable new-user self-signup. Account
   invitations and administrator-created users remain the internal onboarding
   path.
2. Run the role checks below with staging accounts.
3. Confirm the application can toggle a milestone item.
4. Confirm Finance is redirected away from `/projects`.
5. Confirm deactivating an assigned profile blocks its next request.
6. Confirm the project and marketing site still build and load.

Apply the same reviewed migration to production only after staging acceptance.
Take a database backup or confirm point-in-time recovery before changing the
production project.

## Manual role checks

### Owner

- Can open `/projects` and every active project.
- Can see project financial information on a project detail.
- Can create a project.
- Can toggle a milestone item.

### Assigned Member

- Can see only assigned projects.
- Can open the assigned project's tabs.
- Cannot receive project financial fields.
- Can toggle milestone completion.
- Cannot directly change milestone label, assignee, week, or dates.

### Unassigned Member

- Cannot see the project in the portfolio.
- Cannot open the project by guessing its URL.
- Cannot toggle one of its milestones through a direct request.

### Finance

- Cannot enter `/projects` or a project detail page.
- Can still read the finance records required by the future Finance module.

### Inactive Member

- Cannot enter the admin platform.
- Cannot read an assigned project through the API.
- Cannot read private employment or document records.
- Can sign in with another active account from the access-unavailable screen.

### Anonymous request

- Has no table privilege on internal project or project-financial tables.
- Cannot retrieve internal records through the Supabase REST API.

## Chunk 1 completion record

Fill this in during the team review:

- Permission matrix approved by: ____________________
- Migration reviewed by: ___________________________
- Database tests run by: ___________________________
- Owner account tested by: _________________________
- Member account tested by: ________________________
- Finance account tested by: _______________________
- Staging accepted by: _____________________________
- Remaining defects: _______________________________

Do not start Chunk 2 until every critical permission check passes and the owner
has accepted the staging demonstration.
