---
phase: 02-wheel-scoring
plan: 01
subsystem: database
tags: [supabase, postgres, rls, sql, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "auth.users table, seed users with deterministic UUIDs, Supabase local dev environment"
provides:
  - "profiles table with tier column and auto-create trigger"
  - "wheels table with free-tier 1-wheel limit enforced at DB level via SECURITY DEFINER function"
  - "categories table with as-is/to-be scores (1-10)"
  - "count_user_wheels() SECURITY DEFINER function"
  - "on_auth_user_created trigger"
  - "Seed data: 2 profiles, 2 wheels, 16 categories (8 per wheel)"
  - "TypeScript types: ProfileRow, WheelRow, CategoryRow, Database"
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 03-action-items, 04-snapshots]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SECURITY DEFINER function for RLS policy that would otherwise cause infinite recursion"
    - "wheels table created before count_user_wheels() to avoid forward reference in SQL function body"
    - "Profiles inserted manually in seed.sql — trigger fires only for new signups, not existing seed rows"

key-files:
  created:
    - supabase/migrations/20260314000001_wheel_schema.sql
  modified:
    - supabase/seed.sql
    - src/types/database.ts

key-decisions:
  - "wheels table must be created BEFORE count_user_wheels() function — SQL validates function body references at definition time"
  - "Free-tier wheel limit enforced at DB level (RLS INSERT policy + SECURITY DEFINER count) not frontend-only"
  - "Seed profiles inserted explicitly (ON CONFLICT DO NOTHING) — trigger only fires on new auth.users inserts, not pre-existing seed rows"

patterns-established:
  - "SECURITY DEFINER pattern: use for functions called inside RLS policies to avoid infinite recursion"
  - "Seed data pattern: Phase N seed appended as new DO $$ block in seed.sql with phase header comment"

requirements-completed: [WHEEL-01, WHEEL-02, WHEEL-06, WHEEL-07]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 2 Plan 01: Wheel Schema Summary

**PostgreSQL schema with profiles/wheels/categories tables, RLS policies, SECURITY DEFINER free-tier wheel limit, auto-profile trigger, and seed data for both dev users**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T22:58:00Z
- **Completed:** 2026-03-14T23:01:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Migration creates 3 tables (profiles, wheels, categories) with RLS enabled and full CRUD policies
- count_user_wheels() SECURITY DEFINER function blocks free users from inserting a second wheel at DB level
- handle_new_user() trigger auto-creates profiles on new auth.users inserts
- Seed data provides 2 profiles (free/premium), 2 wheels with deterministic UUIDs, 16 scored categories (8 per wheel)
- TypeScript types (ProfileRow, WheelRow, CategoryRow, Database) ready for Phase 2 hooks and components

## Task Commits

Each task was committed atomically:

1. **Task 1: Write wheel schema migration** - `30ecb11` (feat)
2. **Task 2: Extend seed.sql and update TypeScript types** - `38e44da` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/migrations/20260314000001_wheel_schema.sql` - Full wheel schema: profiles, wheels, categories tables, RLS policies, trigger, SECURITY DEFINER function
- `supabase/seed.sql` - Phase 2 block appended: profiles, wheels, and 16 category rows for both seed users
- `src/types/database.ts` - Hand-authored TypeScript types matching the new schema

## Decisions Made

- wheels table created before count_user_wheels() function to avoid forward reference SQL error (function body is validated at definition time)
- Free-tier wheel limit at DB level via RLS INSERT policy calling SECURITY DEFINER function — ensures limit holds regardless of client
- Profiles seeded manually in seed.sql because the auto-profile trigger only fires for NEW inserts into auth.users, not pre-existing seed rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reordered migration objects to fix forward reference**
- **Found during:** Task 1 (Write wheel schema migration)
- **Issue:** The plan specified count_user_wheels() BEFORE the wheels table, but PostgreSQL validates SQL function bodies at definition time — the function body references public.wheels which didn't exist yet, causing "relation public.wheels does not exist" error
- **Fix:** Reordered to: (1) profiles, (2) handle_new_user trigger, (3) wheels table with RLS enabled but no policies, (4) count_user_wheels() function, (5) wheels RLS policies, (6) categories table and policies
- **Files modified:** supabase/migrations/20260314000001_wheel_schema.sql
- **Verification:** supabase db reset completed without errors
- **Committed in:** 30ecb11 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — forward reference in migration ordering)
**Impact on plan:** Fix required for migration to apply at all. No scope creep, schema is identical to plan spec.

## Issues Encountered

- Forward reference error on first db reset: count_user_wheels() referenced public.wheels before it existed. Fixed by reordering migration objects (wheels table first, then function, then wheels policies).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema and types are in place — all Phase 2 plans (02-02 through 02-06) can proceed
- Both seed users have profile rows, wheels, and 8 scored categories after `supabase db reset`
- TypeScript types exported and ready for Supabase client hooks in next plans
- No blockers

---
*Phase: 02-wheel-scoring*
*Completed: 2026-03-14*

## Self-Check: PASSED

- supabase/migrations/20260314000001_wheel_schema.sql: FOUND
- supabase/seed.sql: FOUND
- src/types/database.ts: FOUND
- .planning/phases/02-wheel-scoring/02-01-SUMMARY.md: FOUND
- Commit 30ecb11 (Task 1): FOUND
- Commit 38e44da (Task 2): FOUND
