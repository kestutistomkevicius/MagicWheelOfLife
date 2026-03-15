---
phase: 04-snapshots-and-comparison
plan: 02
subsystem: database
tags: [typescript, supabase, hooks, testing, vitest, tdd]

# Dependency graph
requires:
  - phase: 04-01
    provides: snapshots + snapshot_scores DB tables with RLS + Wave 0 test stubs

provides:
  - SnapshotRow and SnapshotScoreRow TypeScript types exported from database.ts
  - Database.public.Tables entries for snapshots and snapshot_scores (Update: never)
  - useSnapshots hook with saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist
  - Full unit test coverage for all 4 hook operations (9 tests, all green)

affects:
  - 04-03 (SnapshotNameDialog UI — imports useSnapshots + SnapshotRow)
  - 04-04 (SnapshotsPage — imports useSnapshots)
  - 04-05 (ComparisonChart — imports SnapshotScoreRow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hook-first: Supabase calls isolated in stateless hooks, never leak into components
    - TDD RED-GREEN: test stubs written and confirmed failing before implementation
    - vi.hoisted + mockFrom pattern for Supabase from() mocking in Vitest
    - buildChain() helper for fluent Supabase chain simulation in tests
    - mockReturnValueOnce for multi-step operations (saveSnapshot two-step insert)

key-files:
  created:
    - src/hooks/useSnapshots.ts
  modified:
    - src/types/database.ts
    - src/hooks/useSnapshots.test.ts

key-decisions:
  - "useSnapshots is stateless (no useState/useEffect) — all state managed by calling components"
  - "saveSnapshot guard: empty categories returns error without touching DB — fail-fast before any insert"
  - "checkSnapshotsExist uses count: exact + head: true — no data transfer, minimal query cost"

patterns-established:
  - "Pattern 1: Two-step insert pattern for saveSnapshot — snapshot first, scores second using returned snap.id"
  - "Pattern 2: buildChain() extended with count field for head:true queries used in checkSnapshotsExist tests"

requirements-completed: [SNAP-01, SNAP-02]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 4 Plan 02: Snapshots Types + Hook Summary

**Stateless useSnapshots hook with 4 DB operations (save/list/fetchScores/checkExist) backed by SnapshotRow + SnapshotScoreRow TypeScript types and 9 passing TDD tests**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-15T12:13:00Z
- **Completed:** 2026-03-15T12:21:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `SnapshotRow` and `SnapshotScoreRow` types to `database.ts` with `Update: never` (immutable) entries in `Database.public.Tables`
- Implemented all 4 `useSnapshots` operations: `saveSnapshot` (two-step insert with empty-categories guard), `listSnapshots` (DESC order), `fetchSnapshotScores` (ASC order), `checkSnapshotsExist` (count-only query)
- Replaced all 9 `it.todo` stubs in `useSnapshots.test.ts` with real tests following the `useActionItems.test.ts` mock pattern — all pass, full suite remains 92/92 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SnapshotRow + SnapshotScoreRow to database.ts** - `46c8d10` (feat)
2. **Task 2: Implement useSnapshots hook + tests** - `d42bff6` (feat, TDD RED→GREEN)

## Files Created/Modified

- `src/types/database.ts` — Added SnapshotRow, SnapshotScoreRow exports + Database.public.Tables.snapshots and .snapshot_scores entries
- `src/hooks/useSnapshots.ts` — New stateless hook, 4 operations, SaveSnapshotParams + UseSnapshotsResult interfaces exported
- `src/hooks/useSnapshots.test.ts` — 9 unit tests replacing Wave 0 todo stubs; uses vi.hoisted + buildChain pattern

## Decisions Made

- `useSnapshots` is stateless (no React state/effects) — consistent with `useActionItems` and `useCategories` hook-first pattern
- Empty-categories guard returns error before any DB call — fail-fast over optimistic insert
- `checkSnapshotsExist` uses `{ count: 'exact', head: true }` — transfers no rows, just a COUNT; minimal cost for a boolean check
- `buildChain()` in tests accepts optional `count` field for head-query shape `{ data: null, error: null, count: N }`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Types and hook contract are stable: downstream plans (03, 04, 05) can import `useSnapshots`, `SnapshotRow`, `SnapshotScoreRow` without guessing
- Wave 0 test stubs for `SnapshotNameDialog`, `SnapshotsPage`, `ComparisonChart` remain as `it.todo` — implementation plans will replace them
- Full test suite green: no regressions introduced

---
*Phase: 04-snapshots-and-comparison*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: src/types/database.ts
- FOUND: src/hooks/useSnapshots.ts
- FOUND: src/hooks/useSnapshots.test.ts
- FOUND: 04-02-SUMMARY.md
- FOUND: commit 46c8d10 (feat: SnapshotRow + SnapshotScoreRow types)
- FOUND: commit d42bff6 (feat: useSnapshots hook + tests)
