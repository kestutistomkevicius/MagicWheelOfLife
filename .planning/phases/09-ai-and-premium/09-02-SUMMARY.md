---
phase: 09-ai-and-premium
plan: 02
subsystem: database
tags: [postgres, supabase, migrations, rls, pg_cron, typescript]

# Dependency graph
requires:
  - phase: 09-ai-and-premium
    provides: Wave 0 test stubs (09-01); existing migrations through 20260318
provides:
  - ai_chat_messages table with RLS (select/insert/delete own) and composite index
  - pg_cron monthly cleanup job for messages older than 3 months
  - profiles.color_scheme column with default 'amber'
  - AiChatMessageRow TypeScript type
  - color_scheme field on ProfileRow
affects:
  - 09-03 (useAiChat hook needs ai_chat_messages table)
  - 09-04 (AIChatPanel uses AiChatMessageRow type)
  - 09-07 (color palette UI reads/writes profiles.color_scheme)
  - 09-08 (useColorScheme hook reads color_scheme from ProfileRow)

# Tech tracking
tech-stack:
  added: [pg_cron extension (Supabase built-in)]
  patterns:
    - "RLS on ai_chat_messages: three policies (select/insert/delete own) using (SELECT auth.uid()) = user_id pattern"
    - "pg_cron cleanup: scheduled via SELECT cron.schedule() in migration, not application code"
    - "TypeScript row types: use type alias (not interface) to preserve Supabase mapped-type inference"

key-files:
  created:
    - supabase/migrations/20260320000001_ai_chat_messages.sql
    - supabase/migrations/20260320000002_profiles_color_scheme.sql
  modified:
    - src/types/database.ts

key-decisions:
  - "AiChatMessageRow uses type alias (not interface) — Supabase PostgrestVersion tag inference breaks when Database.Tables references an interface via Omit<>"
  - "pg_cron cleanup job runs at 3am on 1st of each month — low-traffic window, predictable retention window"
  - "profiles.color_scheme default 'amber' — preserves existing visual appearance for all users on migration"

patterns-established:
  - "New table migrations: always include CREATE TABLE, composite index, ENABLE ROW LEVEL SECURITY, and all three CRUD policies in one file"

requirements-completed: [AI-01, PREMIUM-02]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 9 Plan 02: DB Migrations — ai_chat_messages and color_scheme

**PostgreSQL foundations for AI Coach and palette features: ai_chat_messages table with RLS + pg_cron cleanup, profiles.color_scheme column, TypeScript types extended**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-20T13:21:34Z
- **Completed:** 2026-03-20T13:26:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `ai_chat_messages` table with composite index and three RLS policies (select/insert/delete own)
- Scheduled pg_cron monthly cleanup job for messages older than 3 months
- Added `color_scheme` column to `profiles` with default 'amber' (safe for existing users)
- Extended `database.ts` with `AiChatMessageRow` type and `color_scheme` field on `ProfileRow`
- Both migrations applied via `supabase db reset`; `npm run build` exits 0

## Task Commits

1. **Task 1: Migration — ai_chat_messages table + pg_cron** - `6baf195` (feat)
2. **Task 2: Migration — profiles.color_scheme + TypeScript types** - `d5ade7b` (feat)

## Files Created/Modified

- `supabase/migrations/20260320000001_ai_chat_messages.sql` - ai_chat_messages table, composite index, RLS policies (3), pg_cron monthly cleanup job
- `supabase/migrations/20260320000002_profiles_color_scheme.sql` - ADD COLUMN color_scheme text NOT NULL DEFAULT 'amber' on profiles
- `src/types/database.ts` - AiChatMessageRow type, color_scheme on ProfileRow, ai_chat_messages in Database.Tables

## Decisions Made

- **TypeScript `type` vs `interface` for row types:** Used `type AiChatMessageRow = {...}` instead of `interface AiChatMessageRow {...}`. The Supabase typed client uses `__InternalSupabase: { PostgrestVersion: '12' }` tag for mapped type inference; `Omit<interface, keys>` disrupts this inference and resolves all Insert/Update types to `never`. Using `type` alias preserves the inference correctly.
- **pg_cron in migration file:** Scheduled cleanup via `SELECT cron.schedule()` inside the migration (not application code) so the job is version-controlled and applied atomically with the table.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed AiChatMessageRow from `interface` to `type` alias**
- **Found during:** Task 2 (TypeScript types update)
- **Issue:** Plan specified `export interface AiChatMessageRow` but using `interface` caused Supabase's PostgREST type inference to resolve all Insert/Update types across ALL tables to `never`, breaking `npm run build` with 15+ TS2769 errors
- **Fix:** Changed to `export type AiChatMessageRow = {...}` — consistent with existing row types in the file
- **Files modified:** src/types/database.ts
- **Verification:** `npm run build` exits 0
- **Committed in:** d5ade7b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in plan's interface keyword)
**Impact on plan:** Required for build correctness. No scope change.

## Issues Encountered

- `psql` not available on PATH in this environment — verified migration success via `supabase db diff` returning "No schema changes found" (confirms migration was applied and DB matches migrations)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ai_chat_messages` table ready for 09-03 (useAiChat hook) and 09-04 (AIChatPanel component)
- `profiles.color_scheme` ready for 09-07 (palette UI) and 09-08 (useColorScheme hook)
- `AiChatMessageRow` and updated `ProfileRow` types available for all downstream hooks/components

---
*Phase: 09-ai-and-premium*
*Completed: 2026-03-20*
