---
phase: 02-wheel-scoring
plan: "03"
subsystem: data-hooks
tags: [hooks, supabase, tdd, typescript, react]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [useWheel, useCategories]
  affects: [02-04, 02-05]
tech_stack:
  added: []
  patterns: [vi.mock supabase chain, renderHook TDD, Supabase Database generic types]
key_files:
  created:
    - src/hooks/useWheel.ts
    - src/hooks/useCategories.ts
  modified:
    - src/hooks/useWheel.test.ts
    - src/hooks/useCategories.test.ts
    - src/types/database.ts
key_decisions:
  - "useWheel fetches profile tier and first wheel independently — canCreateWheel computed client-side from tier + wheel count"
  - "updateScore does NOT update local state — caller manages optimistic updates via setCategories"
  - "useCategories is stateless — all state lives in useWheel via setCategories, passed as prop"
  - "hasSnapshots passed into useCategories from page — hook never queries snapshots table directly"
metrics:
  duration: "182 seconds (~3 min)"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 2
  files_modified: 3
---

# Phase 2 Plan 3: Data Layer Hooks Summary

**One-liner:** useWheel and useCategories hooks with full Supabase integration tested via vi.mock chain mocking — 18 tests, 0 failures.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement useWheel hook | 38b19bf | src/hooks/useWheel.ts, src/hooks/useWheel.test.ts |
| 2 | Implement useCategories hook | 2e0c1e4 | src/hooks/useCategories.ts, src/hooks/useCategories.test.ts, src/types/database.ts |

## What Was Built

**useWheel** (`src/hooks/useWheel.ts`):
- Loads user profile (tier) and first wheel on mount via sequential Supabase fetches
- Computes `canCreateWheel`: free tier blocked when wheel count >= 1, premium always true
- `createWheel('template')` batch-inserts 8 default categories; `createWheel('blank')` inserts wheel only
- `updateScore` writes single field to categories table — caller owns local state via `setCategories`
- Exports: `useWheel`, `UseWheelResult`, `CategoryRow`, `CreateWheelMode`

**useCategories** (`src/hooks/useCategories.ts`):
- Stateless mutations hook — no internal state, composed with useWheel at page level
- `addCategory` guards at 12 max, assigns `position = currentMaxPosition + 1`
- `renameCategory` calls `onSnapshotWarning()` and returns early when `hasSnapshots=true`
- `removeCategory` guards at 3 min, calls `onSnapshotWarning()` and returns early when `hasSnapshots=true`
- `hasSnapshots` is passed in from page (hardcoded `false` in Phase 2; Phase 4 connects real snapshots count)

## Test Results

```
useWheel.test.ts     9 tests  ✓ PASS
useCategories.test.ts 9 tests ✓ PASS
Total: 18 passed, 0 failed
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Database type missing `Relationships` field for supabase-js v2.99**
- **Found during:** Task 2 — `npm run build` TypeScript compile
- **Issue:** supabase-js v2.99 resolves Insert types as `never` when the Database type omits `Relationships: []` from table definitions. This is a breaking change from earlier v2 versions.
- **Fix:** Added `Relationships: []` to all three table definitions in `src/types/database.ts`
- **Files modified:** `src/types/database.ts`
- **Commit:** 2e0c1e4 (included in Task 2 commit)

## Self-Check: PASSED

- src/hooks/useWheel.ts: FOUND
- src/hooks/useCategories.ts: FOUND
- .planning/phases/02-wheel-scoring/02-03-SUMMARY.md: FOUND
- Commit 38b19bf (useWheel): FOUND
- Commit 2e0c1e4 (useCategories): FOUND
- Build: PASS (0 errors)
- Tests: 18 passed, 0 failed
