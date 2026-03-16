# CLAUDE.md — Wheel of Life SaaS (brand name TBD)

Wheel of Life self-assessment and coaching tool. Users create custom life-area wheels, score them (as-is / to-be), define action items, and track progress over time. Solo founder, .NET background, no frontend experience — Claude owns all frontend code.

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security, auto-generated REST APIs)
- **API (future)**: .NET 10 (C#) — thin API layer only if business logic outgrows Supabase Edge Functions
- **Auth**: Supabase Auth (email/password, social login via Google/Apple)
- **Database**: Supabase-managed PostgreSQL with Row Level Security
- **Hosting (production)**: Vercel (frontend), Supabase Cloud (backend/database)
- **Layout**: Responsive — desktop and tablet. Mobile is stretch.

## Local Dev Environment (no cloud accounts needed)

Everything runs on the developer's machine via Docker. No internet required during development.

**Prerequisites**: Docker Desktop, Node.js (≥20), Supabase CLI, npm.

**What `supabase start` runs locally in Docker**:
- PostgreSQL database (port 54322)
- Auth service / GoTrue (port 54321)
- REST API / PostgREST (port 54321)
- Realtime server (port 54321)
- Storage server (port 54321)
- Studio dashboard UI → http://localhost:54323
- Local SMTP server (for testing auth emails)

**Frontend**: Vite dev server (`npm run dev`) → http://localhost:5173. No Vercel needed locally.

**Migrations**: Create locally via Studio or SQL, capture with `supabase db diff`, store in `supabase/migrations/`. Push to production with `supabase db push --linked`.

## Build / Test / Run

```bash
# === First-time setup ===
supabase init                 # create supabase/ config folder (once per project)
npm install                   # install frontend dependencies

# === Daily local development ===
supabase start                # start all Supabase services in Docker
npm run dev                   # Vite dev server → http://localhost:5173
                              # Studio dashboard → http://localhost:54323

# === Database ===
supabase db diff --schema public  # capture schema changes as migration file
supabase db reset             # wipe local DB and re-run all migrations + seed
supabase status               # show local URLs and API keys

# === Testing ===
npm test                      # frontend tests
npm run build                 # verify production build works locally

# === Stop local environment ===
supabase stop                 # stop Docker containers (data preserved)
supabase stop --no-backup     # stop and wipe all local data

# === Deploy to production (when ready) ===
git push origin main          # triggers Vercel auto-deploy (frontend)
supabase db push --linked     # push migrations to production Supabase
```

## Session Protocol

1. Read `LIVING-SPEC.md` — what is currently built.
2. Check `backlog.md` — next prioritized work. --> Replaced by GSD own .planning/Roadmap.md 
3. Check `decisions.md` — if the task touches prior architectural context.
4. Confirm session goal with the user before starting.
5. **End of session**: update `changelog.md`, `sessions.md`, `backlog.md`, `LIVING-SPEC.md`. Non-negotiable.

## Project Docs (read when relevant, not every session)

| File | Contents |
|---|---|
| `idea.md` | Product vision, personas, phasing, monetization |
| `data-model.md` | Entities, properties, relationships, enums, RLS policies |
| `screens/` | One file per screen: layout, components, data flow |
| `decisions.md` | Architectural choices and trade-offs |
| `docs/coding-standards.md` | Development philosophy and coding rules |

## Domain Model

**Wheel** → belongs to a User. Contains 3–12 **Categories** (life areas).
Each Category has: as-is score (1–10), to-be score (1–10), 0–7 **Action Items** (free text, optional deadline).
A Wheel has **Snapshots** — timestamped score copies for historical comparison.

**Users** → self-signup or coach-referred (future: attribution tracking). Can own multiple Wheels.

**Categories** → default template of 8 standard areas (Health, Career, Relationships, Finance, Fun & Recreation, Personal Growth, Physical Environment, Family & Friends). Users can start from template or blank. Add/rename/remove within 3–12 range.

**Scoring** → 1–10 integer. Side-by-side comparison of any two snapshots. Trend chart at 3+ snapshots. Current vs. previous overlay (stretch).

## Conventions

- ISO dates (YYYY-MM-DD).
- Structured fragments over prose in docs.
- Flag unknowns with ⚠️ OPEN.
- Log every architectural decision in `decisions.md` with rationale.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`.
- English for all UI and documentation.
