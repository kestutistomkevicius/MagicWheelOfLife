# JustAWheelOfLife — Developer Setup

Wheel of Life self-assessment and coaching tool. Users create custom life-area wheels, score them (as-is / to-be), define action items, and track progress over time.

## Prerequisites

- Docker Desktop (running)
- Node.js >= 20
- Supabase CLI
- npm

## First-time setup

1. Clone the repo
2. Install frontend dependencies: `npm install`
3. Copy environment files:
   - `cp .env.local.example .env.local` — fill in anon key from `supabase status`
   - `cp supabase/.env.local.example supabase/.env.local` — fill in Google OAuth credentials (see below)
4. Start local Supabase: `supabase start`
5. Populate `.env.local` with the `ANON_KEY` from `supabase status`
6. Seed the database: `supabase db reset`
7. Start the dev server: `npm run dev`
8. Open http://localhost:5173

## Google OAuth setup (one-time per developer)

Google OAuth requires real credentials — it cannot be mocked locally. Email/password sign-in works without this setup.

1. Go to https://console.cloud.google.com/
2. Create a project (or use an existing one)
3. Enable the "Google+ API" or "Google Identity"
4. Go to APIs & Services -> Credentials -> Create Credentials -> OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs — add EXACTLY: `http://127.0.0.1:54321/auth/v1/callback`
   (note: 127.0.0.1, not localhost — they are treated differently by Google)
7. Copy the Client ID and Client Secret into `supabase/.env.local`
8. Restart Supabase: `supabase stop && supabase start`

## Apple OAuth (Phase 7 only)

Apple OAuth is deferred to production launch (Phase 7). It requires an Apple Developer account
and cannot use localhost callback URLs. Not needed for local development.

## Seed users

After `supabase db reset`, two developer test accounts are available:

| Email             | Password | Tier    | Notes                                                          |
|-------------------|----------|---------|----------------------------------------------------------------|
| free@test.com     | test123  | free    | 8 categories, mid-range scores, mixed action items             |
| premium@test.com  | test123  | premium | 8 categories, 4 snapshots, mixed-trajectory score story        |

The premium user's score story across snapshots shows realistic patterns:
- Career improving (5→8), Health dips then recovers (6→5→7), Relationships declining (8→5)
- Fun & Recreation declining (traded for career gains), Personal Growth improving then plateauing

## Daily workflow

```bash
supabase start     # start all Supabase services in Docker
npm run dev        # Vite dev server → http://localhost:5173
                   # Studio dashboard → http://localhost:54323
```

## Database commands

```bash
supabase db diff --schema public  # capture schema changes as migration file
supabase db reset                 # wipe local DB and re-run all migrations + seed
supabase status                   # show local URLs and API keys
```

## Testing

```bash
npm test           # run frontend tests
npm run build      # verify production build
```

## Project structure

```
src/               # React + TypeScript frontend
supabase/
  config.toml      # Local Supabase configuration (Google OAuth etc.)
  migrations/      # Database schema migrations (run in order)
  seed.sql         # Dev seed data (loaded by supabase db reset)
  .env.local.example  # Template for Google OAuth credentials
```
