# Gamma Developers Website

The marketing website for Gamma Developers, an AI-first software agency that builds production-grade AI agents and internal platforms for established SMBs.

## Local development

1. Copy `.env.example` to `.env.local` and add the required OpenAI key.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The homepage works without Supabase. Add the Supabase variables and apply the migration in `supabase/migrations` to persist AI audit runs.

## Checks

Run `npm run check` for lint and TypeScript validation, and `npm run build` for a production build.
