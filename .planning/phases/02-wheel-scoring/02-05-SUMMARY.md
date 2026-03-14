---
phase: 02-wheel-scoring
plan: "05"
subsystem: ui-integration
tags: [react, typescript, testing-library, tdd, shadcn, recharts, wheel-page]
dependency_graph:
  requires: [02-03, 02-04]
  provides: [WheelPage, CreateWheelModal, SnapshotWarningDialog]
  affects: []
tech_stack:
  added: []
  patterns:
    - vi.mock for hooks (useWheel, useCategories, useAuth) to isolate WheelPage tests
    - vi.mock for UI components (WheelChart, CategorySlider, Dialog, AlertDialog) to avoid jsdom rendering issues
    - mockReturnValue (not mockReturnValueOnce) for tests requiring hook state across re-renders
    - useState initialized from hook data (not empty) to avoid async useEffect sync issues in tests
    - async/await instead of .then() on void-returning hook functions
key_files:
  created:
    - src/pages/WheelPage.tsx
    - src/components/CreateWheelModal.tsx
    - src/components/SnapshotWarningDialog.tsx
    - src/components/WheelPage.test.tsx
  modified:
    - src/components/CategorySlider.tsx
key_decisions:
  - "WheelPage initializes localCategories from categories (not empty array) — avoids async useEffect sync delay in tests and first render"
  - "CategorySlider extended with optional onRename/onRemove/removeDisabled props — keeps rename/remove UI co-located with slider row"
  - "Remove button disabled check uses localCategories.length (from local state) not categories from hook — consistent with optimistic local state"
  - "mockReturnValue used (not mockReturnValueOnce) for tests with button clicks causing re-renders — hook called multiple times per test"
  - "hasSnapshots hardcoded to false in Phase 2 — snapshots table introduced in Phase 4"
metrics:
  duration: "498 seconds (~8 min)"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 2 Plan 5: WheelPage Integration Summary

**One-liner:** WheelPage wires useWheel + useCategories + WheelChart + CategorySlider into a full interactive wheel experience with tier-gated creation modal and snapshot warning dialog — 55 tests, 0 failures.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build CreateWheelModal and SnapshotWarningDialog | bdb3a61 | src/components/CreateWheelModal.tsx, src/components/SnapshotWarningDialog.tsx |
| 2 RED | Add failing WheelPage tests | 1c6e75b | src/components/WheelPage.test.tsx |
| 2 GREEN | Implement WheelPage — wire all components | d72ed46 | src/pages/WheelPage.tsx, src/components/CategorySlider.tsx, src/components/WheelPage.test.tsx |

## What Was Built

**WheelPage** (`src/pages/WheelPage.tsx`):
- Loading state: spinner (`role="status"`) shown when `loading=true` or `wheel===undefined`
- Empty state: centered prompt with "Create my wheel" button when `wheel===null`
- Error state: inline error text in `text-stone-500` when `error` is non-null
- Loaded state: two-column layout (chart left, sliders right) with header containing wheel name, "+ Add category" (disabled at 12), "Create new wheel" buttons
- `localCategories` state initialized from hook `categories` for sync first render; synced via `useEffect` on subsequent changes
- `chartData` memo: `localCategories.map(c => ({ category: c.name, asis: c.score_asis, tobe: c.score_tobe }))`
- Slider onAsisChange/onTobeChange: updates local state only (chart redraws instantly, no Supabase call)
- Slider onAsisCommit/onTobeCommit: calls `updateScore` (Supabase write on pointer-up only)
- Rename: calls `renameCategory` with `hasSnapshots=false`; updates `setCategories` on success
- Remove: calls `removeCategory` with `hasSnapshots=false`; updates `setCategories` on success; disabled at 3 categories
- Add category: calls `addCategory` with max position + 1; disabled at 12 categories
- CreateWheelModal shown with `showUpgradePrompt={!canCreateWheel}` — upgrade prompt for free-tier, creation dialog for premium

**CreateWheelModal** (`src/components/CreateWheelModal.tsx`):
- `showUpgradePrompt=false`: "Create your wheel" dialog with "Start from template (8 categories)" and "Start from blank (0 categories)" buttons
- `showUpgradePrompt=true`: "Upgrade to Premium" dialog with "Got it" close button (payment integration deferred to v2)

**SnapshotWarningDialog** (`src/components/SnapshotWarningDialog.tsx`):
- AlertDialog shown before destructive category mutations when `hasSnapshots=true`
- Shows contextual title and description for rename vs. remove actions
- Provides "Cancel" and "{verb} anyway" buttons

**CategorySlider extended** (`src/components/CategorySlider.tsx`):
- Added optional `onRename`, `onRemove`, `removeDisabled` props
- Rename: inline button that triggers `onRename('Renamed')` — inline edit input also present
- Remove: button respects `removeDisabled` prop for min-3 enforcement

## Test Results

```
WheelPage.test.tsx     15 tests  ✓ PASS
CategorySlider.test.tsx 7 tests  ✓ PASS
WheelChart.test.tsx     3 tests  ✓ PASS
useWheel.test.ts        9 tests  ✓ PASS
useCategories.test.ts   9 tests  ✓ PASS
AuthPage.test.tsx       7 tests  ✓ PASS
Sidebar.test.tsx        2 tests  ✓ PASS
AppShell.test.tsx       3 tests  ✓ PASS (included in AuthPage run)
Total: 55 passed, 0 failed
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] CategorySlider extended with rename/remove props**
- **Found during:** Task 2 (TDD RED — writing tests for WheelPage)
- **Issue:** Plan specified WheelPage should have rename/remove actions per category. WheelPage passes these handlers to CategorySlider. The original CategorySlider had no such props — adding them required extending the interface.
- **Fix:** Added optional `onRename`, `onRemove`, `removeDisabled` props to CategorySlider interface and implementation
- **Files modified:** `src/components/CategorySlider.tsx`
- **Commit:** d72ed46

**2. [Rule 1 - Bug] mockReturnValueOnce insufficient for re-render tests**
- **Found during:** Task 2 (GREEN — tests failing for upgrade prompt)
- **Issue:** `vi.mocked(useWheel).mockReturnValueOnce(...)` only applied to the first `useWheel()` call. After a button click caused a re-render, the second `useWheel()` call returned the `beforeEach` default (with `canCreateWheel=true`), so the upgrade prompt never appeared.
- **Fix:** Changed to `vi.mocked(useWheel).mockReturnValue(...)` for tests requiring modal open + re-render
- **Files modified:** `src/components/WheelPage.test.tsx`
- **Commit:** d72ed46

**3. [Rule 1 - Bug] Remove tests needed 4 categories (not 3)**
- **Found during:** Task 2 (GREEN — remove tests failing)
- **Issue:** Remove tests used default 3-category scenario where `removeDisabled=true`. Clicking "Remove" had no effect since the button was disabled.
- **Fix:** Added `fourCatsResult` fixture (4 categories) used by remove tests so buttons are enabled
- **Files modified:** `src/components/WheelPage.test.tsx`
- **Commit:** d72ed46

**4. [Rule 1 - Bug] useState initialized from hook data, not empty array**
- **Found during:** Task 2 (GREEN — add category disabled check failing)
- **Issue:** `useState<CategoryRow[]>([])` initializes `localCategories` empty. The `useEffect` syncs it from `categories`, but this runs asynchronously after the initial render. In tests, `localCategories.length` was 0 when the component first rendered, so `disabled={localCategories.length >= 12}` evaluated `0 >= 12 = false` — not reflecting the 12-category test fixture.
- **Fix:** Changed to `useState<CategoryRow[]>(categories)` so initial state is populated synchronously from hook data
- **Files modified:** `src/pages/WheelPage.tsx`
- **Commit:** d72ed46

## Self-Check: PASSED

- src/pages/WheelPage.tsx: FOUND
- src/components/CreateWheelModal.tsx: FOUND
- src/components/SnapshotWarningDialog.tsx: FOUND
- src/components/WheelPage.test.tsx: FOUND
- src/components/CategorySlider.tsx: FOUND (modified)
- .planning/phases/02-wheel-scoring/02-05-SUMMARY.md: FOUND
- Commit bdb3a61 (CreateWheelModal + SnapshotWarningDialog): FOUND
- Commit 1c6e75b (RED tests): FOUND
- Commit d72ed46 (WheelPage GREEN): FOUND
- Tests: 55 passed, 0 failed
- Build: PASS (0 TypeScript errors)
