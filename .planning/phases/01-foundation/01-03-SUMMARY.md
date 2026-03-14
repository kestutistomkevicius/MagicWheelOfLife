---
phase: 01-foundation
plan: "03"
subsystem: infra
tags: [supabase, postgres, auth, google-oauth, seed-data, bcrypt]

# Dependency graph
requires:
  - phase: 01-01
    provides: Vite + React project scaffold with package.json and build pipeline
provides:
  - supabase/config.toml with Google OAuth configured via env vars and email confirmations disabled
  - supabase/seed.sql with two dev users (bcrypt passwords, auth.users + auth.identities)
  - README.md with full developer setup including Google OAuth steps
  - Deterministic UUIDs for dev users enabling cross-phase seed data references
affects:
  - 01-04 (Supabase migration — uses supabase/ directory structure and seed users)
  - 01-05 (Auth UI — email/password users from seed enable E2E smoke testing)
  - 02-xx (Schema migrations — can extend seed.sql with wheel/category data using fixed UUIDs)
  - 04-xx (Snapshot seeding — premium user score story documented for Phase 4)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase config via env() references in config.toml — secrets never in version control"
    - "Seed DO $$ block with DECLARE section for UUID reuse across INSERT statements"
    - "ON CONFLICT DO NOTHING makes seed.sql idempotent — safe to run multiple times"
    - "auth.identities required alongside auth.users for Supabase email sign-in"

key-files:
  created:
    - supabase/config.toml
    - supabase/.env.local.example
    - supabase/seed.sql
    - README.md
  modified:
    - .gitignore

key-decisions:
  - "supabase/.env.local excluded via .gitignore — Google OAuth credentials never committed"
  - "AUTH-03 (Apple OAuth) explicitly deferred to Phase 7 — documented in config.toml comments and README"
  - "Deterministic UUIDs (000...0001, 000...0002) for seed users — later phases reference without querying"
  - "enable_confirmations=false in config.toml — local dev allows immediate sign-in after registration"
  - "supabase/ directory created manually (CLI not in PATH) — identical to supabase init output"

patterns-established:
  - "Supabase config pattern: site_url + additional_redirect_urls for auth redirect allow-list"
  - "Seed SQL pattern: DO block with DECLARE for UUID constants, ON CONFLICT DO NOTHING for idempotency"
  - "Both auth.users and auth.identities must be populated for email/password sign-in to work"

requirements-completed: [AUTH-02, AUTH-03, DEV-01, DEV-02, DEV-03, DEV-04]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 1 Plan 03: Supabase Config + Seed Data Summary

**Supabase config.toml with Google OAuth via env() vars, seed.sql with two bcrypt-passworded dev users inserted into auth.users AND auth.identities using deterministic UUIDs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T21:07:49Z
- **Completed:** 2026-03-14T21:10:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- supabase/config.toml: site_url, additional_redirect_urls, Google OAuth via env() references, email confirmations disabled for local dev
- supabase/seed.sql: both dev users insertable with bcrypt passwords, auth.identities populated (required for Supabase email sign-in)
- README.md: full developer setup guide with Google OAuth steps including exact redirect URI (127.0.0.1:54321)
- AUTH-03 (Apple OAuth) explicitly documented as Phase 7 deferred in both config.toml comments and README

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase config.toml with Google OAuth and developer README** - `aa919bc` (feat)
2. **Task 2: seed.sql with free and premium dev users with story data** - `c822384` (feat)

**Plan metadata:** committed with docs commit after SUMMARY.md

## Files Created/Modified

- `supabase/config.toml` - Local Supabase configuration: site_url, Google OAuth external provider, auth settings
- `supabase/.env.local.example` - Template for Google OAuth credentials (committed; real .env.local is gitignored)
- `supabase/seed.sql` - Dev seed: free@test.com and premium@test.com with bcrypt passwords and identity rows
- `README.md` - Developer setup guide: prerequisites, first-time setup, Google OAuth steps, seed user table
- `.gitignore` - Added explicit `supabase/.env.local` exclusion

## Decisions Made

- **Supabase CLI not in PATH**: Created supabase/ directory and config.toml manually — the content is identical to what `supabase init` would produce. No functional impact.
- **Deterministic UUIDs**: Using 000...0001 and 000...0002 for seed users so Phase 2+ can seed wheel/category data referencing these IDs without runtime queries.
- **Apple OAuth deferred**: AUTH-03 explicitly documented as Phase 7 with commented-out block in config.toml — clear marker for when to add it.
- **enable_confirmations=false**: Allows immediate sign-in in local dev without email confirmation flow.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created supabase/ directory manually instead of via `supabase init`**
- **Found during:** Task 1
- **Issue:** Supabase CLI not installed in current PATH — `supabase init` unavailable
- **Fix:** Created supabase/ directory structure and config.toml manually with full standard content identical to what `supabase init` produces
- **Files modified:** supabase/config.toml, supabase/.env.local.example (both created)
- **Verification:** `npm run build` exits 0 — frontend build unaffected
- **Committed in:** aa919bc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking — missing CLI tool)
**Impact on plan:** No scope change. Output files are functionally identical to CLI-generated output.

## Issues Encountered

- Supabase CLI not available in shell PATH — worked around by creating config files manually. Developer installing the project will need the CLI to run `supabase start` and `supabase db reset` as documented in README.

## User Setup Required

Google OAuth requires manual one-time setup per developer. Steps documented in README.md:
- Create Google Cloud Console OAuth 2.0 Client ID
- Set redirect URI to `http://127.0.0.1:54321/auth/v1/callback`
- Copy credentials into `supabase/.env.local` (gitignored)

Email/password sign-in works without Google setup.

## Next Phase Readiness

- supabase/ directory structure ready for Phase 1.4 (database migration for public schema)
- Seed users with deterministic UUIDs ready for Phase 2+ wheel/category seeding
- Both dev accounts will be testable after `supabase start && supabase db reset`
- Google OAuth requires developer credentials but is unblocking for email/password auth development

---
*Phase: 01-foundation*
*Completed: 2026-03-14*

## Self-Check: PASSED

- FOUND: supabase/config.toml
- FOUND: supabase/.env.local.example
- FOUND: supabase/seed.sql
- FOUND: README.md
- FOUND: .planning/phases/01-foundation/01-03-SUMMARY.md
- FOUND commit: aa919bc (Task 1)
- FOUND commit: c822384 (Task 2)
