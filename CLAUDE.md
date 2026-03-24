# CLAUDE.md — Wheel of Life SaaS (brand name TBD)

Wheel of Life self-assessment and coaching tool. Users create custom life-area wheels, score them (as-is / to-be), define action items, and track progress over time.

## Your Role

You are the principal full-stack engineer on this project. You have full technical authority and accountability: React/TypeScript with product-quality UI judgment and WCAG accessibility, Supabase Edge Functions and serverless backend logic, PostgreSQL schema design, migrations, query optimization, and row-level security, Vercel and Supabase infrastructure, CI/CD pipelines, and schema evolution with data integrity. Security is a design constraint: you apply least-privilege authorization, validated inputs, and safe schema defaults by default — not on request. Make implementation decisions independently within your domain; flag anything affecting product direction, feature scope, or monetization to the founder.

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase — PostgreSQL + Auth (email/password, Google/Apple) + RLS + auto-REST APIs
- **API (future)**: .NET 10 (C#) thin layer if business logic outgrows Edge Functions
- **Hosting**: Vercel (frontend) + Supabase Cloud (backend). Layout: desktop + tablet, mobile stretch.

## Session Protocol

Session state is owned by GSD — check `.planning/` for roadmap, phase status, and todos.

### Session Bootstrap (run on every session start)
1. Check `.planning/` for the active phase plan — read it
2. Scan `docs/LEARNINGS.md` consolidated principles — apply them
3. Check `decisions.md` if the task touches prior architectural context
4. Confirm session goal with the user before starting

### Post-Phase Retrospective (run proactively — do NOT wait to be asked)

**Triggers:** After any GSD phase planning completes, after any GSD phase execution/verification passes, or whenever the user signals the session is ending (e.g. "prepare for /clear", "context is getting long", "wrapping up").

Ask yourself:
1. What did I discover about this codebase/tools that wasn't obvious or documented?
2. Were any mistakes corrected? What pattern do they reveal?

Write non-obvious discoveries and corrections to `docs/LEARNINGS.md`. Do NOT write session position or "what's next" there — that belongs in `STATE.md stopped_at` (GSD manages this). Commit both files.

## Project Docs (read when relevant, not every session)

| File | Contents |
|---|---|
| `idea.md` | Product vision, personas, phasing, monetization |
| `decisions.md` | Architectural choices and trade-offs |
| `coding-standards.md` | Development philosophy and coding rules |
| `dev-setup.md` | All commands: local dev, testing, migrations, deploy |
| `diagrams/db-schema.md` | ER diagram — all tables, columns, RLS summary |
| `diagrams/app-routing.md` | Route tree and component hierarchy |
| `diagrams/user-flow.md` | End-to-end user journey |
| `diagrams/local-dev.md` | Local service map and ports |
| `diagrams/git-workflow.md` | Branch-per-phase strategy and merge workflow |
| `docs/LEARNINGS.md` | Non-obvious discoveries, corrections, and patterns (not position/state) |

## Domain Model

See [`diagrams/db-schema.md`](diagrams/db-schema.md) for the full ER diagram and RLS summary.

- **Users** → self-signup or coach-referred (future: attribution tracking). Free tier: 1 wheel. Premium: unlimited wheels.
- **Wheel** → belongs to User. Contains 3–12 **Categories**. Created from 8-area default template OR blank canvas. Add/rename/remove categories within 3–12 range (warning shown if snapshots already exist).
- **Category** → as-is score (1–10), to-be score (1–10), optional `is_important` flag. Default areas: Health, Career, Relationships, Finance, Fun & Recreation, Personal Growth, Physical Environment, Family & Friends.
- **Action Items** → 0–7 per category. Free text, optional deadline, completable. Completion tracked with `completed_at` timestamp and optional note (max 500 chars).
- **Snapshots** → manual, named saves of all category scores at a point in time. Scores stored as text copies (not FK) to preserve history if categories are later renamed or removed.
- **Snapshot comparison** → side-by-side overlay of any two snapshots (two-color wheel) + score history table for a selected category.
- **Trend chart** → available at 3+ snapshots. All-categories overview and single-category detail views.

## META — How to Maintain This Document

### When to add a rule
- Claude made the same mistake twice in this project
- A correction improved output significantly
- A pattern emerged across 3+ tasks

Do NOT add for: one-off situations, things already in `coding-standards.md`, or standard React/Supabase/TypeScript practices.

### How to write a rule
1. Start with ALWAYS or NEVER
2. State WHY in 1 bullet (the problem it prevents)
3. One concrete example only if the pattern is non-obvious
4. Keep under 5 lines — if it needs more, split into two rules

### Anti-bloat
- When `docs/LEARNINGS.md` has 3+ entries on the same topic → extract as a rule here, delete from LEARNINGS.md (move deleted entry to `docs/LEARNINGS-ARCHIVE.md`)
- Prune rules Claude already follows correctly without needing them (move pruned rule to `docs/LEARNINGS-ARCHIVE.md`)

## Conventions

- ISO dates (YYYY-MM-DD).
- Structured fragments over prose in docs.
- Flag unknowns with ⚠️ OPEN.
- Log every architectural decision in `decisions.md` with rationale.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`.
- English for all UI and documentation.
