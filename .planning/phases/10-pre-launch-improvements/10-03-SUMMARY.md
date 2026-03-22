---
plan: "10-03"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Added snapshot hard-delete to SnapshotsPage: Delete button per row, inline Confirm/Cancel UX, optimistic state removal.

## What Was Built

- Added `pendingDeleteId` state to `SnapshotsPage.tsx`
- Added `deleteSnapshot()` function: optimistic removal from `snapshots`, `selectedSnapIds`, `scoresCache`, `allHistoryScores`, then Supabase delete
- Added inline confirmation UX: Delete → Confirm delete / Cancel (no modal)
- Added `vi.mock('@/lib/supabase', ...)` to `SnapshotsPage.test.tsx`
- Replaced 3 it.todo stubs with 3 passing tests

## Self-Check

- [x] Delete button renders per snapshot row ✓
- [x] Clicking Delete shows Confirm/Cancel inline ✓
- [x] Confirming removes snapshot from DOM immediately ✓
- [x] `npm test -- --run src/pages/SnapshotsPage.test.tsx` — 11 tests pass ✓
- [x] `npm run build` passes ✓

## Key Files

### Modified
- `src/pages/SnapshotsPage.tsx` — delete button, pendingDeleteId state, deleteSnapshot function
- `src/pages/SnapshotsPage.test.tsx` — supabase mock + 3 new passing tests
