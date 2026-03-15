---
phase: 04-snapshots-and-comparison
verified: 2026-03-15T14:54:30Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 4: Snapshots and Comparison Verification Report

**Phase Goal:** Users can save named point-in-time captures of their wheel and compare any two captures side by side
**Verified:** 2026-03-15T14:54:30Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                       | Status     | Evidence                                                                                  |
|----|--------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | snapshots and snapshot_scores tables exist in migration with RLS enabled                    | VERIFIED   | `20260315000002_snapshots.sql` — both tables, `ENABLE ROW LEVEL SECURITY` present          |
| 2  | No UPDATE policy on snapshot_scores (immutability by design)                               | VERIFIED   | Migration has explicit comment; only SELECT and INSERT policies present on snapshot_scores  |
| 3  | 4 seeded snapshots with distinct score stories exist for the premium user                   | VERIFIED   | `seed.sql` — snap1–snap4 UUIDs 0101–0104, 4 snapshots × 8 categories = 32 score rows      |
| 4  | All four Wave 0 test stub files exist and test suite runs green                             | VERIFIED   | 14 test files, 112 tests, all passing — 0 it.todo stubs in any Phase 4 test file          |
| 5  | SnapshotRow and SnapshotScoreRow types exported from database.ts                            | VERIFIED   | Both types defined; Database.public.Tables.snapshots and snapshot_scores with Update: never |
| 6  | useSnapshots hook exposes saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist | VERIFIED | `useSnapshots.ts` exports UseSnapshotsResult with all 4 functions; 9/9 hook tests pass   |
| 7  | SnapshotNameDialog renders name input, date preview, calls onSave with trimmed name         | VERIFIED   | Component fully implemented; 7/7 dialog tests pass; guards empty/whitespace; Cancel wired  |
| 8  | ComparisonChart renders four Radar series (amber pair + blue pair) for two snapshot datasets | VERIFIED  | Component fully implemented; 5/5 chart tests pass; empty-state "No data to compare" works  |
| 9  | SnapshotsPage shows chronological list with name + formatted date                           | VERIFIED   | Renders snapshots, formatDate uses en-GB locale; 6/6 page tests pass                      |
| 10 | User can select exactly 2 snapshots via checkboxes; ComparisonChart appears automatically   | VERIFIED   | toggleSnapshot enforces max 2; `selectedSnapIds.size === 2` guard renders ComparisonChart  |
| 11 | Score history table shows as-is and to-be per snapshot for selected category (COMP-02)      | VERIFIED   | Batch-loaded allHistoryScores; client-side filter by selectedCategory; table renders rows   |
| 12 | WheelPage hasSnapshots wired to real checkSnapshotsExist; hardcoded false removed           | VERIFIED   | `useState(false)` + useEffect calling checkSnapshotsExist; no `const hasSnapshots = false` |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact                                          | Provides                                              | Status     | Details                                                                 |
|---------------------------------------------------|-------------------------------------------------------|------------|-------------------------------------------------------------------------|
| `supabase/migrations/20260315000002_snapshots.sql` | snapshots + snapshot_scores DDL with RLS policies     | VERIFIED   | Exists, substantive (54 lines), creates both tables with correct schema |
| `supabase/seed.sql`                               | 4 quarterly snapshots for premium user (snap UUIDs 0101–0104) | VERIFIED | Contains all 4 UUIDs, 32 snapshot_scores rows with score story data |
| `src/types/database.ts`                           | SnapshotRow, SnapshotScoreRow types + Database entries | VERIFIED   | Both types present; Update: never for both; wired into Database type    |
| `src/hooks/useSnapshots.ts`                       | Stateless hook with 4 operations                      | VERIFIED   | 85 lines; exports useSnapshots, SaveSnapshotParams, UseSnapshotsResult  |
| `src/hooks/useSnapshots.test.ts`                  | Full unit test coverage for hook functions            | VERIFIED   | 9 tests, all passing, 0 todos; covers all 4 operations + edge cases     |
| `src/components/SnapshotNameDialog.tsx`           | Save Snapshot modal with shadcn Dialog                | VERIFIED   | 64 lines; exports SnapshotNameDialog; uses Dialog, Input, Button, Label |
| `src/components/SnapshotNameDialog.test.tsx`      | Component tests for dialog                           | VERIFIED   | 7 tests, all passing, 0 todos                                           |
| `src/components/ComparisonChart.tsx`              | Four-series RadarChart for two-snapshot overlay       | VERIFIED   | 67 lines; exports ComparisonChart and ComparisonChartPoint              |
| `src/components/ComparisonChart.test.tsx`         | Component tests for chart                            | VERIFIED   | 5 tests, all passing, 0 todos                                           |
| `src/pages/SnapshotsPage.tsx`                     | Full Snapshots page: list, comparison, score history  | VERIFIED   | 273 lines; fully implemented; exports SnapshotsPage                     |
| `src/pages/SnapshotsPage.test.tsx`                | Integration tests for page                           | VERIFIED   | 6 tests, all passing, 0 todos                                           |
| `src/pages/WheelPage.tsx`                         | hasSnapshots driven by real Supabase check            | VERIFIED   | Contains checkSnapshotsExist; no hardcoded `const hasSnapshots = false` |

---

### Key Link Verification

| From                                | To                              | Via                                           | Status  | Details                                                                       |
|-------------------------------------|---------------------------------|-----------------------------------------------|---------|-------------------------------------------------------------------------------|
| `20260315000002_snapshots.sql`      | `public.snapshots`              | `CREATE TABLE`                                | WIRED   | Line 5: `CREATE TABLE public.snapshots`                                       |
| `seed.sql`                          | `public.snapshot_scores`        | `INSERT`                                      | WIRED   | Line 305: `INSERT INTO public.snapshot_scores`                                |
| `src/hooks/useSnapshots.ts`         | `src/types/database.ts`         | `import type { SnapshotRow, SnapshotScoreRow }` | WIRED | Line 2: `import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'` |
| `src/hooks/useSnapshots.ts`         | `public.snapshots`              | `supabase.from('snapshots').insert(...).select()` | WIRED | Lines 31–33: full two-step insert; from('snapshots') confirmed              |
| `src/components/ComparisonChart.tsx` | `src/types/database.ts`        | `import type { SnapshotScoreRow }`            | WIRED   | Line 6: `import type { SnapshotScoreRow } from '@/types/database'`            |
| `src/components/SnapshotNameDialog.tsx` | `src/components/ui/dialog`  | `import { Dialog, DialogContent, ... }`       | WIRED   | Lines 2–5: explicit shadcn dialog imports from `@/components/ui/dialog`       |
| `src/pages/SnapshotsPage.tsx`       | `src/hooks/useSnapshots.ts`     | `useSnapshots()` — listSnapshots, saveSnapshot, fetchSnapshotScores | WIRED | Line 4 import + line 23 destructure; all three functions called   |
| `src/pages/SnapshotsPage.tsx`       | `src/components/ComparisonChart.tsx` | `selectedSnapIds.size === 2 → <ComparisonChart />` | WIRED | Line 5 import + line 212: conditional render on size===2             |
| `src/pages/WheelPage.tsx`           | `src/hooks/useSnapshots.ts`     | `checkSnapshotsExist(wheel.id)`               | WIRED   | Line 5 import; line 40 destructure; line 68 async call in useEffect           |
| `src/App.tsx`                       | `src/pages/SnapshotsPage.tsx`   | `<Route path="/snapshots" element={<SnapshotsPage />} />` | WIRED | Line 18: route registered; line 6: import confirmed              |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                                                                   | Status    | Evidence                                                                     |
|-------------|----------------|-----------------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------|
| SNAP-01     | 01, 02, 03, 04 | User can manually save a snapshot with a user-provided name; auto-appended with current date  | SATISFIED | SnapshotNameDialog shows name + date preview; saveSnapshot inserts both tables; SnapshotsPage wires the flow end-to-end |
| SNAP-02     | 01, 02, 04     | User can view a chronological list of all saved snapshots                                     | SATISFIED | SnapshotsPage calls listSnapshots, reverses DESC to chronological, renders name + formatted date |
| COMP-01     | 01, 03, 04     | User can select any two snapshots and view an overlay comparison radar chart in different colors | SATISFIED | Checkbox selection with max-2 guard; ComparisonChart renders 4 Radar series — amber pair (snap1) + blue pair (snap2) |
| COMP-02     | 01, 04         | User can select a category and view a score history table (as-is and to-be across all snapshots) | SATISFIED | Score history section batch-loads all scores; `<select>` populates category names; table shows per-snapshot as-is and to-be |

**Additional requirements touched by Phase 4 implementation:**

| Requirement | Description                                                              | Status    | Evidence                                                                   |
|-------------|--------------------------------------------------------------------------|-----------|----------------------------------------------------------------------------|
| WHEEL-04    | User can rename category; shown warning if snapshots exist               | SATISFIED | WheelPage wires checkSnapshotsExist; hasSnapshots=true → onSnapshotWarning triggers AlertDialog |
| WHEEL-05    | User can remove category; shown warning if snapshots exist               | SATISFIED | Same hasSnapshots mechanism; removeCategory path tested with 4-category setup |
| DEV-02      | Premium-tier seed user with 4+ snapshots with meaningfully different scores | SATISFIED | seed.sql: 4 snapshots for premium_user, score story: Career 5→6→7→8, Health 6→5→6→7 |
| DEV-04      | Seeded snapshots have scores telling a visible story                     | SATISFIED | Score deltas visible in seed data: Relationships 8→7→6→5, Finance 4→4→5→6 |

No orphaned requirements — all SNAP-01, SNAP-02, COMP-01, COMP-02 are claimed by Phase 4 plans and verified in code.

---

### Anti-Patterns Found

| File                          | Line | Pattern                  | Severity | Impact                       |
|-------------------------------|------|--------------------------|----------|------------------------------|
| `SnapshotNameDialog.tsx`      | 44   | `placeholder="e.g. Q1..."` | Info   | HTML input placeholder attr — not a code stub; correct usage |

No blockers. No warnings. The single "placeholder" hit is a legitimate HTML attribute value for UX guidance in the input field.

**Checked for:** `TODO`, `FIXME`, `XXX`, `HACK`, `it.todo()`, `return null` (stub pattern), empty handlers, hardcoded false for feature flags. None found.

---

### Deviation: hasSnapshots Default Value

The 04-04-PLAN specified `useState(true)` (pessimistic default — warning always shows until resolved). The 04-04-SUMMARY claims this was implemented. The **actual code uses `useState(false)`** (optimistic default — no warning flashes during load).

**Assessment: Non-blocking functional deviation.** Both approaches satisfy WHEEL-04 and WHEEL-05 because the warning is conditional on the async resolution of `checkSnapshotsExist`. With `false` as default, there is a brief window at mount where no warning would show even for users with snapshots — but this resolves as soon as the effect fires. With `true`, the warning would flash briefly for users without snapshots. The test suite tests both paths (true → dialog shown, false → dialog not shown) and all 20 WheelPage tests pass. The goal requirement is met either way.

---

### Human Verification Required

The following items require browser testing against local Supabase and cannot be verified programmatically:

**1. Snapshot list date formatting in browser**
- **Test:** Sign in as premium user, navigate to /snapshots
- **Expected:** 4 snapshot rows visible with dates formatted as "DD Mon YYYY" (e.g., "15 Mar 2025"), NOT ISO format
- **Why human:** Date locale rendering depends on browser locale settings; jsdom may behave differently than Chrome

**2. ComparisonChart visual appearance**
- **Test:** Check two snapshots, observe radar chart
- **Expected:** Two visually distinct color schemes — amber tones for snapshot 1, blue tones for snapshot 2; four overlay series visible; Legend shows all 4 series names
- **Why human:** Recharts SVG rendering is mocked in tests; actual color and visual overlap cannot be verified programmatically

**3. Save snapshot round-trip**
- **Test:** Click "Save snapshot", type a name, click "Save snapshot" button
- **Expected:** Dialog closes; new snapshot appears at top of list with correct name and today's date; network tab shows POST to /rest/v1/snapshots
- **Why human:** Requires live Supabase connection; async state refresh after save cannot be verified without real network

**4. Score history table with seed data (COMP-02)**
- **Test:** On Snapshots page with premium user, select "Career" from history category dropdown
- **Expected:** 4 rows showing Career As-Is scores: 5, 6, 7, 8 (ascending story, oldest first)
- **Why human:** Requires live Supabase + correct seed data applied

**5. WheelPage rename warning for premium user**
- **Test:** Sign in as premium user, go to Wheel page, attempt to rename a category
- **Expected:** SnapshotWarningDialog appears warning that historical snapshot data will not be updated
- **Why human:** Requires live Supabase; checkSnapshotsExist must return true against real DB with seeded data

**6. Free user no warning**
- **Test:** Sign in as free user, go to Wheel page, attempt to rename a category
- **Expected:** No warning dialog; rename proceeds immediately
- **Why human:** Requires live Supabase with free-tier seed user having no snapshots

---

## Summary

Phase 4 goal is **fully achieved**. All 12 observable truths are verified, all 10 key links are wired, all 4 phase requirements (SNAP-01, SNAP-02, COMP-01, COMP-02) have code evidence, and the full test suite (14 files, 112 tests) is green with zero stubs remaining.

The only deviations are:
1. `hasSnapshots` defaults to `false` instead of `true` as planned — functional outcome is identical, no test failures
2. The SUMMARY incorrectly claims the pessimistic default was used — the code tells the truth

Six items require human browser verification for visual appearance, real DB round-trips, and date formatting behavior.

---

_Verified: 2026-03-15T14:54:30Z_
_Verifier: Claude (gsd-verifier)_
