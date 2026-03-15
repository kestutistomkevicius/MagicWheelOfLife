# decisions.md — Architectural Decisions Log

## DEC-001: Tech Stack — Supabase + React + Vercel over .NET full-stack

**Date**: 2026-03-14
**Status**: Accepted
**Context**: Solo founder with .NET background, no frontend experience. Need multi-user SaaS with secure auth, persistent data, and progress tracking. MVP speed is critical. Two options evaluated:

### Option A — .NET Full-Stack (rejected for MVP)

| Layer | Choice |
|---|---|
| Backend | .NET 10, ASP.NET Web API, C# |
| Frontend | React + TypeScript + Tailwind |
| Database | PostgreSQL (self-managed via Docker) |
| ORM | Entity Framework Core + Npgsql |
| Auth | Auth0 (free tier) |
| Local dev | Docker Compose (API + PostgreSQL) |
| Hosting | Railway or Render |
| CI/CD | GitHub Actions |

**Pros**: Owner knows .NET. Full control over business logic. Traditional, well-understood architecture.
**Cons**: Must write dozens of API endpoints, auth flows, migration scripts. Slower path to MVP. More infrastructure to manage as a solo founder.

### Option B — Supabase-centered (accepted)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | Best charting ecosystem (Recharts, D3). Claude Code generates high-quality React. Tailwind keeps styling consistent. |
| Backend | Supabase (managed PostgreSQL + auto-generated REST APIs) | Eliminates custom API layer for CRUD operations. Row Level Security handles authorization at DB level. |
| Auth | Supabase Auth (email/password + Google/Apple social login) | Built-in, no separate provider needed. 50K MAU on free tier. |
| Database | Supabase-managed PostgreSQL | Same Postgres everywhere. No Docker setup for DB. Migrations via Supabase CLI. |
| Hosting (frontend) | Vercel | Git-push deploys, preview URLs per branch, free SSL, global CDN. |
| Hosting (backend) | Supabase Cloud | Managed PostgreSQL, auth, storage, edge functions — one platform. |
| Local dev | Supabase CLI + Vite | Local Postgres + auth emulator via `supabase start`. Vite for React hot reload. |
| CI/CD | Vercel auto-deploy (frontend) + Supabase CLI (migrations) | Minimal config. Push to main = live. |
| Future API | .NET 10 (C#) thin layer | Only if business logic outgrows Supabase Edge Functions (e.g., AI SMART goal evaluation). |

**Pros**: Dramatically faster to MVP. Auth solved out of the box. Real-time features available. Less code = less maintenance. No Docker needed for local DB. Supabase is open-source (no lock-in). React frontend talks directly to Supabase — fewer moving parts.
**Cons**: Owner's .NET skills underutilized for MVP. Business logic lives in frontend or Edge Functions (TypeScript). New paradigm to learn. Refactoring is significant if outgrowing Supabase's model.

### Decision rationale
For a solo founder building an MVP, shipping speed outweighs architectural purity. Supabase eliminates the need to build auth, API endpoints, and database management from scratch. The .NET 10 backend remains a documented fallback for Phase 2+ when complex server-side logic (AI features, integrations, batch processing) justifies it.

### Escape hatch
Supabase uses standard PostgreSQL. If the project outgrows Supabase, the database can be exported and moved to any PostgreSQL host. The React frontend can point to a .NET API with minimal refactoring of the data access layer.

---

## DEC-002: .NET 10 LTS over .NET 8

**Date**: 2026-03-14
**Status**: Accepted (for future API layer)
**Context**: .NET 10 released November 2025 as LTS, supported until November 2028. .NET 8 LTS support ends November 2026. Since the .NET API layer is a Phase 2+ concern, starting with .NET 10 avoids a migration mid-project.

---

## DEC-003: Vercel free tier is not suitable for commercial use

**Date**: 2026-03-14
**Status**: Noted
**Context**: Vercel's free Hobby tier prohibits commercial use. Once the product accepts payments or runs ads, must upgrade to Vercel Pro ($20/user/month). Acceptable cost for a solo founder at that stage. Budget for this in Phase 2 monetization planning.

---

## DEC-004: Local-first development — no cloud accounts needed for MVP build

**Date**: 2026-03-14
**Status**: Accepted
**Context**: Evaluated whether development requires Supabase Cloud or Vercel accounts from day one.

### Finding: both run fully locally

**Supabase CLI** spins up the entire Supabase stack in Docker containers on the developer's machine:
- PostgreSQL database (port 54322)
- Auth / GoTrue service
- REST API / PostgREST
- Realtime server
- Storage server
- Studio dashboard UI (http://localhost:54323)
- Local SMTP server (captures auth emails for testing)

Two commands: `supabase init` + `supabase start`. Works offline. All Docker images are pulled once on first run.

**Vercel** is not needed locally at all. React frontend runs via Vite's built-in dev server (`npm run dev` → http://localhost:5173). Vercel is only a deployment target. The `vercel dev` CLI command exists to replicate Vercel's edge environment locally, but is unnecessary for this project — there are no Vercel-specific features in the codebase.

### Local dev prerequisites
- Docker Desktop (runs Supabase containers)
- Node.js ≥ 20 (runs Supabase CLI and React dev server)
- Supabase CLI (via npm: `npm install -g supabase`)
- Code editor (VS Code recommended)

### Migration workflow
1. Make schema changes via local Studio dashboard or write SQL directly
2. Capture with `supabase db diff --schema public` → creates migration file in `supabase/migrations/`
3. Test locally with `supabase db reset` (re-runs all migrations from scratch)
4. Commit migration files to Git
5. When ready for production: `supabase db push --linked` applies migrations to cloud

### Decision
Start building immediately with local-only setup. Create Supabase Cloud project and Vercel account only when ready to deploy for real users. This eliminates account management overhead during the MVP build phase and allows fully offline development.

---

## DEC-006: `tier` column must only be writable server-side

**Date**: 2026-03-15
**Status**: Deferred — must fix before monetization goes live
**Context**: The current `profiles: update own` RLS policy allows any authenticated user to update their entire profile row, including the `tier` column. A user could call `supabase.from('profiles').update({ tier: 'premium' })` from the browser and self-upgrade for free.

### Decision
Before any payment flow is live, restrict tier changes to server-side only:
- Drop or narrow the `profiles: update own` RLS policy so `tier` cannot be updated by the user directly.
- Manage tier upgrades exclusively via a Supabase Edge Function or service-role key, triggered by a verified payment event (e.g., Stripe webhook).

### Rationale
Tier controls access to paid features. If a user can set their own tier, the entire monetization model is bypassed. This is a critical security boundary.

### Trigger to revisit
Before implementing any payment integration (Phase 7 / Launch).

---

## DEC-005: Trend chart — both views with potential revert to single-category

**Date**: 2026-03-14
**Status**: Accepted (revisit after first user testing)
**Context**: The trend chart (visible at 3+ snapshots) needs to show score history. Two viable approaches: show all categories on one chart, or show one category at a time with a selector.

### Decision
Ship both views: an all-categories overview (all score lines on one chart) and a single-category detail view (score over time for a selected category). A future variant to consider: automatically switch to single-category view when the wheel has many categories (e.g., 8+) to avoid visual clutter.

### Rationale
Starting with both gives real user feedback on which view they actually use. If the all-categories view is ignored or confusing, revert to single-category only. Don't optimise before data.

### Trigger to revisit
If user feedback or analytics show the all-categories view is unused or actively confusing, remove it and default to single-category detail.

---
