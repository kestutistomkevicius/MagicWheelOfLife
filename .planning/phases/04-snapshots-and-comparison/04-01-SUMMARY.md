---
phase: 04-snapshots-and-comparison
plan: 01
subsystem: database
tags: [postgres, supabase, rls, migrations, seed-data, vitest]

# Dependency graph
requires:
  - phase: 03-action-items
    provides: action_items table and seed patterns established
  - phase: 02-wheel-scoring
    provides: wheels, categories tables and deterministic UUID seed pattern
provides:
  - snapshots table with RLS (select/insert/delete own, no update)
  - snapshot_scores table with RLS (select/insert own, no update/delete — immutable by design)
  - 4 quarterly snapshots seeded for premium user (UUIDs 0101-0104) with 32 score rows
  - Wave 0 test stubs for useSnapshots, SnapshotNameDialog, ComparisonChart, SnapshotsPage
affects:
  - 04-02 (useSnapshots hook implementation)
  - 04-03 (SnapshotNameDialog component)
  - 04-04 (SnapshotsPage + ComparisonChart)
  - 05-trend-chart (references snap UUIDs 0101-0104)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - snapshot immutability enforced at DB level (no UPDATE policy on snapshot_scores)
    - category_name stored as text copy in snapshot_scores, not FK to categories
    - Wave 0 stub pattern: import only describe/it from vitest, use only it.todo (no feature imports)
    - deterministic UUIDs for seed snapshots (000...0101..0104) for cross-phase references

key-files:
  created:
    - supabase/migrations/20260315000002_snapshots.sql
    - src/hooks/useSnapshots.test.ts
    - src/components/SnapshotNameDialog.test.tsx
    - src/components/ComparisonChart.test.tsx
    - src/pages/SnapshotsPage.test.tsx
  modified:
    - supabase/seed.sql

key-decisions:
  - "snapshot_scores has no UPDATE policy — scores are immutable once written; cascade delete via snapshot FK handles cleanup"
  - "category_name stored as TEXT COPY in snapshot_scores, not FK to categories — preserves historical accuracy across category renames/deletes"
  - "Wave 0 stub pattern: only import describe/it from vitest, use it.todo — no feature module imports so stubs survive until implementation plans run"
  - "Deterministic snapshot UUIDs 0101-0104 used in seed — Phase 5 trend chart references these directly without queries"

patterns-established:
  - "Immutable table pattern: RLS with select/insert/delete but NO update policy — document intent in SQL comment"
  - "Text-copy denormalization: store category_name as text snapshot in score tables for historical accuracy"

requirements-completed: [SNAP-01, SNAP-02, COMP-01, COMP-02]

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 4 Plan 01: Snapshots Foundation Summary

**PostgreSQL snapshots + snapshot_scores tables with immutability-by-RLS, 4 quarterly seed snapshots for premium user (32 score rows), and Wave 0 vitest it.todo() stubs for all Phase 4 test files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T11:07:49Z
- **Completed:** 2026-03-15T11:11:05Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created snapshots and snapshot_scores tables with full RLS — select/insert/delete own; intentionally no UPDATE policy enforcing immutability
- Seeded 4 quarterly snapshots for premium user with deterministic UUIDs 0101-0104 and 32 score rows with distinct trajectory stories (Career up, Health dip/recovery, Relationships down, Finance up)
- Created 4 Wave 0 test stub files covering all Phase 4 planned behaviors — test suite runs green (24 todos, no failures)

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration — snapshots + snapshot_scores tables with RLS** - `c50f8ea` (feat)
2. **Task 2: Seed data — 4 snapshots for premium user + Wave 0 test stubs** - `e7106e9` (feat)

## Files Created/Modified
- `supabase/migrations/20260315000002_snapshots.sql` - DDL for snapshots and snapshot_scores tables with RLS policies
- `supabase/seed.sql` - Phase 4 block appended: 4 snapshot rows + 32 snapshot_score rows for premium user
- `src/hooks/useSnapshots.test.ts` - Wave 0 stubs: saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist
- `src/components/SnapshotNameDialog.test.tsx` - Wave 0 stubs: name input, save/cancel behaviors, isSaving state
- `src/components/ComparisonChart.test.tsx` - Wave 0 stubs: radar series rendering, empty state, union merge, zero fill
- `src/pages/SnapshotsPage.test.tsx` - Wave 0 stubs: list rendering, selection, chart visibility, score history table

## Decisions Made
- snapshot_scores has no UPDATE policy — immutability enforced at DB level; plan document comment explains intent (SNAP-V2-02 adds rename in v2)
- category_name stored as TEXT COPY (not FK to categories.id) — preserves score history across category renames/removals
- Wave 0 stubs import ONLY describe/it from vitest — no feature module imports so files compile before implementation exists
- Deterministic snapshot UUIDs 0101-0104 chosen for Phase 5 cross-phase seed references

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- snapshots and snapshot_scores tables ready for Plan 02 (useSnapshots hook)
- Test stubs in place — Plans 02-04 verify commands will run immediately without failures
- Seed data provides rich comparison stories for manual verification in Plans 03-04

---
*Phase: 04-snapshots-and-comparison*
*Completed: 2026-03-15*

## Self-Check: PASSED

- supabase/migrations/20260315000002_snapshots.sql — FOUND
- src/hooks/useSnapshots.test.ts — FOUND
- src/components/SnapshotNameDialog.test.tsx — FOUND
- src/components/ComparisonChart.test.tsx — FOUND
- src/pages/SnapshotsPage.test.tsx — FOUND
- Commit c50f8ea — FOUND
- Commit e7106e9 — FOUND
