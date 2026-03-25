---
phase: 12-multi-wheel-ux
plan: "01"
subsystem: frontend-tests
tags: [tests, multi-wheel, trend-page, sidebar]
dependency_graph:
  requires: []
  provides: [MW-01-test-coverage, MW-02-test-coverage, stale-data-clear]
  affects: [src/components/Sidebar.test.tsx, src/pages/TrendPage.test.tsx, src/pages/TrendPage.tsx]
tech_stack:
  added: []
  patterns: [vi.hoisted-mock, rerender-state-simulation, synchronous-state-clear-on-effect]
key_files:
  created: []
  modified:
    - src/components/Sidebar.test.tsx
    - src/pages/TrendPage.test.tsx
    - src/pages/TrendPage.tsx
decisions:
  - useWheel mock added to Sidebar.test.tsx via vi.hoisted + vi.mock — consistent with existing hook mock pattern
  - Existing /my wheel/i regex tightened to /^my wheel$/i to prevent false match against 'My Wheels' plural label
  - rerender() used to simulate React state update after selectWheel — simpler than act() wrapper for hook mock updates
  - Stale data clear (setSnapshots/setAllScores/setSelectedCategory) placed before cancelled flag — runs synchronously before async load begins
metrics:
  duration: 149s
  completed: 2026-03-24
---

# Phase 12 Plan 01: Multi-Wheel UX Test Coverage + Stale Data Fix Summary

Add missing test coverage for MW-01 (snapshot reload on wheel switch) and MW-02 (sidebar plural label), plus one-line fix to prevent stale data flash on wheel switch in TrendPage.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add useWheel mock and plural label tests to Sidebar.test.tsx | cd56ea3 | src/components/Sidebar.test.tsx |
| 2 | Add snapshot reload test after wheel switch in TrendPage.test.tsx | 72d7e6e | src/pages/TrendPage.test.tsx |
| 3 | Clear stale snapshot data synchronously on wheel switch in TrendPage | 35ce248 | src/pages/TrendPage.tsx |

## What Was Built

Test coverage for two previously untested branches in the multi-wheel implementation:

**Sidebar MW-02 coverage:** Added `vi.hoisted` + `vi.mock` block for `useWheel` in `Sidebar.test.tsx`. Default mock returns `wheels: []` in `beforeEach`. New `describe('wheel label')` block has two tests: singular label when `wheels.length === 1`, plural label when `wheels.length > 1`. Fixed the existing `/my wheel/i` regex to `/^my wheel$/i` so it does not match "My Wheels" and produce a false positive.

**TrendPage MW-01 coverage:** New test `'reloads snapshots for the newly selected wheel when wheel is switched'` uses `mockSelectWheel.mockImplementation` to update the mock return value when `selectWheel` is called, then `rerender(<TrendPage />)` to trigger the `useEffect([wheel?.id])` re-fire with the new wheel id. Asserts `mockListSnapshots` was called with `'wheel-2'`.

**TrendPage stale-data fix:** Added three synchronous state clears (`setSnapshots([])`, `setAllScores([])`, `setSelectedCategory('')`) at the top of `useEffect([wheel?.id])` in `TrendPage.tsx`. This prevents the previous wheel's chart data showing briefly while new data loads.

## Verification

```
Test Files  29 passed (29)
      Tests 332 passed | 1 todo (333)
```

Full suite green. 332 tests pass (up from ~329 pre-plan). No regressions.

## Deviations from Plan

None — plan executed exactly as written. All three tasks followed the specified patterns.

## Self-Check: PASSED

- `src/components/Sidebar.test.tsx` — exists and contains "My wheels" test
- `src/pages/TrendPage.test.tsx` — exists and contains "reloads snapshots" test
- `src/pages/TrendPage.tsx` — exists and contains `setSnapshots([])`
- Commits cd56ea3, 72d7e6e, 35ce248 — all present in git log
