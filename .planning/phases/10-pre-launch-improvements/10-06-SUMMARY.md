---
plan: "10-06"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Added soft-delete UI to WheelPage: Delete button in heading, pending-deletion banner, and "Recover a wheel" empty-state section.

## What Was Built

- Delete wheel button (text link style) in the wheel heading area — hidden while renaming
- Pending-deletion banner listing soft-deleted wheels with "Deleting in ~10 min" text and Undo buttons
- "Recover a wheel" section in empty state when wheel=null and soft-deleted wheels exist
- 6 passing tests in `WheelPage.test.tsx` covering all three UI surfaces

## Self-Check

- [x] Delete button renders and calls `softDeleteWheel(wheel.id)` ✓
- [x] Pending-deletion banner shows for soft-deleted wheels with Undo ✓
- [x] Undo button calls `undoDeleteWheel(wheel.id)` ✓
- [x] "Recover a wheel" section renders in empty state ✓
- [x] `npm test -- --run src/pages/WheelPage.test.tsx` passes (6/6) ✓
- [x] `npm run build` passes ✓

## Key Files

### Modified
- `src/pages/WheelPage.tsx` — Delete button, pending-deletion banner, empty-state recovery section
- `src/pages/WheelPage.test.tsx` — 6 passing tests for soft-delete UI
