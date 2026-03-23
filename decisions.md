# decisions.md — Architectural Decisions Log

## DEC-001: Tech Stack — Supabase + React + Vercel over .NET full-stack

**Date**: 2026-03-14
**Status**: Accepted
**Context**: Solo founder with .NET background, no frontend experience. MVP speed is critical. .NET full-stack was evaluated and rejected — see `decisions_history.md` for the rejected option detail.

### Supabase-centered stack (accepted)

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
**Decision**: Build entirely locally via Supabase CLI (`supabase start`) + Vite (`npm run dev`). Create Supabase Cloud and Vercel accounts only when deploying for real users. See `diagrams/local-dev.md` for service map and ports.

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

---

## DEC-007: Role model — admin, coach, user (separate concerns)

**Date**: 2026-03-23
**Status**: Accepted (coach role deferred to post-launch)

### Context
Phase 15 introduced an `admin` role for founder operations. As the product grows toward coaching monetization, a distinct `coach` role will be needed — coaches are not admins, but an admin can also be a coach.

### Decision
Three roles: `user` (default), `coach` (coaching clients, future), `admin` (founder operations). These are not a hierarchy — a user can hold multiple roles. The founder will initially hold both `admin` and `coach`.

Role assignment:
- `user`: default on signup
- `coach`: manually assigned by admin, or via future invite flow
- `admin`: service-role only (no self-assignment)

Phase 15 implements `admin` only. `coach` role and coach-specific features (view consented wheels, coach dashboard, CRM) are deferred until post-launch when coaching clients exist.

### Rationale
Separating concerns now prevents a role hierarchy assumption from being baked in. Admin = operational control. Coach = client relationship access. They overlap only when the founder is also the coach.

### Trigger to revisit
First external coaching client onboarded. Review coach role scope: consent model, wheel access, session notes, CRM needs.
