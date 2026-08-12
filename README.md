# Gamma Developers Website + Internal Platform

One Next.js application containing Gamma's public marketing site, owner-only CMS boundary, and private operating platform.

## Application boundaries

- `/` is the public marketing site in `app/(marketing)`.
- `/login` is the private account entry point in `app/(auth)`.
- `/dashboard`, `/projects`, `/people`, `/clients`, and `/cms` are in `app/(admin)` and use a completely separate shell.
- `cms_` database tables may publish selected rows to the website.
- `app_` database tables are internal and grant no anonymous access.

The `proxy.ts` file performs the initial session gate. It is not the data-security boundary: server-only data functions verify the user, and Supabase Row Level Security is the final enforcement layer.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add the OpenAI key used by the public audit and the Supabase project URL/publishable key.
3. Apply `supabase/migrations/202608120001_internal_platform_foundation.sql` to the shared Supabase project.
4. Create the two owner accounts in Supabase Auth, then promote them in the SQL editor:

   ```sql
   update public.app_profiles
   set role = 'owner'
   where id in (
     select id from auth.users
     where email in ('first-owner@gammadevelopers.ai', 'second-owner@gammadevelopers.ai')
   );
   ```

5. Replace the example addresses above with the real owner emails.
6. Run `npm install`.
7. Run `npm run dev` and open `http://localhost:3000`.

The migration intentionally does not create a credentials/secrets table. The product brief requires secrets to be built last, with a dedicated encryption and audit design.

## Permission model

- Owners can access all release-one records.
- Members see projects only when present in `app_project_members`.
- A member sees only their own employment and document records.
- Finance can read invoices, client context, project context, and project financials; it cannot read HR documents or technical details.
- Project value lives in `app_project_financials`, never in `app_projects`, preventing it from appearing in member project queries.
- Employee documents are stored in the private `app-private-documents` bucket.
- Internal records are archived with `archived_at`; authenticated users receive no delete grant.

Before real employee or client data is entered, verify the RLS matrix with separate owner, member, finance, and anonymous sessions by calling the Supabase Data API directly. UI visibility is not a security test.

## Checks

Run `npm run check` for lint and TypeScript validation, and `npm run build` for a production webpack build. Webpack is selected because the current Node 26 development environment prevents Turbopack's CSS worker from binding its local port.
