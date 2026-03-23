---
plan: "10-02"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Extended useWheel hook with soft-delete and undo functions, fixed canCreateWheel to filter active wheels only.

## What Was Built

- Fixed `fetchData()`: `canCreateWheel` now derived from `activeWheels` (non-deleted only); `firstWheel` is first active wheel
- Added `softDeleteWheel(wheelId)`: optimistic state update (deleted_at, canCreateWheel, active wheel switch + category reload), then DB persist
- Added `undoDeleteWheel(wheelId)`: optimistic deleted_at clear, then DB persist
- Both functions exported from `UseWheelResult` interface
- Replaced 5 it.todo stubs with 5 passing tests in `useWheel.test.ts`

## Self-Check

- [x] `UseWheelResult` exports `softDeleteWheel` and `undoDeleteWheel` ✓
- [x] Wheels query selects `deleted_at` ✓
- [x] `canCreateWheel` uses active wheels filter ✓
- [x] All 5 soft-delete tests pass ✓
- [x] `npm test -- --run src/hooks/useWheel.test.ts` — 21 tests pass ✓
- [x] `npm run build` passes ✓

## Key Files

### Modified
- `src/hooks/useWheel.ts` — softDeleteWheel, undoDeleteWheel, fixed canCreateWheel/firstWheel derivation
- `src/hooks/useWheel.test.ts` — 5 soft-delete/undo tests replacing it.todo stubs
