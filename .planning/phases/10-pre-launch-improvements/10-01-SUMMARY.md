---
plan: "10-01"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Applied WheelRow type extension and added it.todo test stubs for all Phase 10 behaviors.

## What Was Built

- Extended `WheelRow` type with `deleted_at: string | null`
- Updated `Database.Tables.wheels.Update` to include `deleted_at`
- Fixed `mockWheel` in `useWheel.test.ts` to include `deleted_at: null`
- Added 5 soft-delete stubs to `useWheel.test.ts`
- Created `WheelPage.test.tsx` with 6 soft-delete UI stubs
- Added 3 snapshot delete stubs to `SnapshotsPage.test.tsx`
- Fixed inline wheel mocks in `SnapshotsPage.test.tsx`

Note: `Sidebar.test.tsx` and `WheelChart.test.tsx` already had real tests added by Wave 1 parallel agents (10-04, 10-05) — real tests supersede todo stubs.

## Deviations

- `supabase db reset` skipped due to Docker port binding issue (54322 not available). Migration file exists at `supabase/migrations/20260321000001_wheel_soft_delete.sql` and will apply on next `supabase start` / Docker restart.

## Self-Check

- [x] `WheelRow` has `deleted_at: string | null` ✓
- [x] `Database.Tables.wheels.Update` includes `deleted_at` ✓
- [x] `npm test -- --run` passes (313 tests, 15 todo) ✓
- [x] `npm run build` passes ✓
- [ ] `supabase db reset` — skipped (Docker port issue)

## Key Files

### Modified
- `src/types/database.ts` — WheelRow + Update type extended
- `src/hooks/useWheel.test.ts` — mockWheel fixed + 5 soft-delete stubs
- `src/pages/SnapshotsPage.test.tsx` — inline mocks fixed + 3 delete stubs

### Created
- `src/pages/WheelPage.test.tsx` — 6 soft-delete UI stubs
