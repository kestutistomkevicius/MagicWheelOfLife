---
phase: 04-snapshots-and-comparison
plan: "04"
subsystem: pages
tags: [pages, snapshots, comparison, tdd, hasSnapshots, WheelPage]
dependency_graph:
  requires: [04-03, 04-02]
  provides: [SnapshotsPage, WheelPage-hasSnapshots]
  affects: [SNAP-01, SNAP-02, COMP-01, COMP-02]
tech_stack:
  added: []
  patterns: [TDD RED-GREEN, pessimistic default state, lazy score fetching, batch history load]
key_files:
  created:
    - src/pages/SnapshotsPage.tsx
  modified:
    - src/pages/SnapshotsPage.test.tsx
    - src/pages/WheelPage.tsx
    - src/components/WheelPage.test.tsx
decisions:
  - "hasSnapshots initialized to true (pessimistic) in WheelPage — warning always shows until checkSnapshotsExist resolves, preventing silent false-negatives"
  - "SnapshotsPage batch-loads all snapshot scores on mount for history table — avoids N+1 per category-select change"
  - "scoresCache Record used for comparison scores — lazy fetch on checkbox selection, avoids redundant Supabase calls"
  - "Existing WheelPage snapshot warning tests updated to await checkSnapshotsExist resolution — synchronous clicks before async resolve gave stale hasSnapshots=true"
metrics:
  duration: "6m"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 1
  files_modified: 3
requirements:
  - SNAP-01
  - SNAP-02
  - COMP-01
  - COMP-02
---

# Phase 04 Plan 04: SnapshotsPage + WheelPage hasSnapshots Summary

**One-liner:** Full SnapshotsPage UI (list, checkboxes, ComparisonChart, score history table) wired with real useSnapshots hook; WheelPage hasSnapshots driven by live checkSnapshotsExist call with pessimistic default.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SnapshotsPage — full implementation + tests | cb659cb | SnapshotsPage.tsx, SnapshotsPage.test.tsx |
| 2 | WheelPage — activate hasSnapshots via real Supabase check + tests | b951cd8 | WheelPage.tsx, WheelPage.test.tsx |

## What Was Built

### SnapshotsPage (`src/pages/SnapshotsPage.tsx`)
- Calls `listSnapshots(wheel.id)` on mount; reverses DESC API order for chronological display
- Empty state: "No snapshots yet. Save your first snapshot to get started."
- Single snapshot hint: "Save at least one more snapshot to compare."
- Snapshot list with checkboxes — max 2 selectable; 3rd disabled when 2 already checked
- `ComparisonChart` appears automatically when exactly 2 snapshots selected; lazy score fetch with `scoresCache`
- Score history table: batch-loads all snapshot scores on mount; `<select>` for category filter; table rows per snapshot (name, date, as-is, to-be)
- `SnapshotNameDialog` wired for save; post-save refreshes both snapshot list and history scores
- Uses `useAuth()` + `useWheel()` internally (no prop-drilling); categories from DB for save
- 6 tests passing

### WheelPage (`src/pages/WheelPage.tsx`)
- Removed: `const hasSnapshots = false // Phase 2: snapshots table does not exist yet`
- Added: `import { useSnapshots }` + `const { checkSnapshotsExist } = useSnapshots()`
- `hasSnapshots` initialized to `true` (pessimistic default) — SnapshotWarningDialog always shows until check resolves
- `useEffect` fires when `wheel?.id` is available; calls `checkSnapshotsExist(wheel.id)` and sets actual state
- Rename/remove warning dialogs now reflect real snapshot existence

## Test Results

- SnapshotsPage: 6/6 passing (0 todos remaining)
- WheelPage: 20/20 passing (2 new tests added, 4 existing updated for async)
- Full suite: 112/112 passing
- `npx tsc --noEmit`: 0 errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated 4 existing WheelPage tests for async hasSnapshots resolution**
- **Found during:** Task 2 GREEN phase
- **Issue:** Existing snapshot warning tests clicked Rename/Remove before `checkSnapshotsExist` resolved. With `hasSnapshots` now starting as `true` (pessimistic), synchronous clicks used the default value instead of the resolved `false`, causing assertion failures.
- **Fix:** Added `await waitFor(() => expect(mockCheckSnapshotsExist).toHaveBeenCalled())` before each click to ensure resolution.
- **Files modified:** src/components/WheelPage.test.tsx
- **Commit:** b951cd8 (included in Task 2 commit)

**2. [Rule 1 - Bug] Fixed test assertions using `getByText` when snapshot names appear in both list and history table**
- **Found during:** Task 1 GREEN phase
- **Issue:** Tests using `getByText('Q1 Review')` threw "Found multiple elements" once history table loaded (name appears in both list row and table row).
- **Fix:** Changed to `getAllByText` / `getAllByRole` / `waitFor` on combobox presence.
- **Files modified:** src/pages/SnapshotsPage.test.tsx
- **Commit:** cb659cb (included in Task 1 commit)

## Self-Check: PASSED

Files confirmed:
- src/pages/SnapshotsPage.tsx: FOUND
- src/pages/SnapshotsPage.test.tsx: FOUND (6 implemented tests, 0 todos)
- src/pages/WheelPage.tsx: FOUND (no 'const hasSnapshots = false' present)
- src/components/WheelPage.test.tsx: FOUND (20 tests, 2 new hasSnapshots tests)

Commits confirmed:
- cb659cb: feat(04-04): implement SnapshotsPage — list, save, compare, history table
- b951cd8: feat(04-04): activate hasSnapshots via real checkSnapshotsExist check
