---
phase: 07-action-items-and-wheel-polish
plan: 06
subsystem: ui
tags: [react, typescript, recharts, lucide-react, tailwind, vitest]

requires:
  - phase: 07-03
    provides: updateCategoryImportant hook, is_important column on categories, tier from useWheel

provides:
  - Star icon toggle on CategorySlider with premium gating and at-limit gating
  - WheelPage wiring of isImportant, onToggleImportant, userTier, importantCount to each CategorySlider
  - WheelChart important-category Radar layer (amber-700) and hover-highlight Radar layer (amber-400)

affects:
  - 07-action-items-and-wheel-polish

tech-stack:
  added: []
  patterns:
    - "Merged dataset pattern for Recharts extra Radar layers: extend data points with asisImportant/asisHighlight keys instead of per-Radar data override (Recharts v3 does not support per-Radar data prop)"
    - "IIFE in JSX for conditional with local variables: (() => { const x = ...; return <button /> })()"

key-files:
  created: []
  modified:
    - src/components/CategorySlider.tsx
    - src/components/CategorySlider.test.tsx
    - src/components/WheelChart.tsx
    - src/components/WheelChart.test.tsx
    - src/pages/WheelPage.tsx
    - src/components/WheelPage.test.tsx

key-decisions:
  - "Recharts v3 Radar does not accept per-component data prop — merged dataset with asisImportant and asisHighlight keys used instead of separate data arrays"
  - "Star button uses IIFE in JSX to avoid extracting a separate StarButton component for a one-off conditional-with-locals pattern"

patterns-established:
  - "Merged dataset pattern: when Recharts Radar needs different data per layer, extend the top-level data array with extra numeric keys and use distinct dataKeys"

requirements-completed:
  - POLISH-04

duration: 242min
completed: 2026-03-16
---

# Phase 7 Plan 06: Important Category Star Toggle and WheelChart Layers Summary

**Star icon on CategorySlider with premium gating, WheelPage wiring via four new props, and two extra Recharts Radar layers (amber important + amber-400 hover highlight) using merged dataset pattern**

## Performance

- **Duration:** ~242 min (including plan 07-06 execution + repo setup)
- **Started:** 2026-03-16T09:13:03Z
- **Completed:** 2026-03-16T13:14:42Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- CategorySlider renders a Star (lucide-react) in the header row when `onToggleImportant` is provided; premium-gated with tooltip for free users; at-limit gated when 3 categories already marked
- WheelPage passes `isImportant`, `onToggleImportant`, `userTier`, and `importantCount` to every CategorySlider — star click calls `updateCategoryImportant` with toggled value
- WheelChart implements two extra Radar layers: Important (amber-700, fillOpacity 0.65) and Highlighted (amber-400, fillOpacity 0.5), both backward-compatible (no visual change when props absent)

## Task Commits

1. **Task 1: CategorySlider star icon** - `3044ce8` (feat)
2. **Task 2: WheelPage prop wiring** - `94cb974` (feat)
3. **Task 3: WheelChart extra Radar layers** - `0a30d82` (feat)

## Files Created/Modified

- `src/components/CategorySlider.tsx` — Added Star import, four new props, IIFE star button in header row
- `src/components/CategorySlider.test.tsx` — 8 new tests for all star icon scenarios (22 total)
- `src/components/WheelChart.tsx` — Removed stub underscore prefixes, merged dataset with asisImportant/asisHighlight, two conditional Radar components
- `src/components/WheelChart.test.tsx` — Updated Radar mock to expose data-name/data-fill, 6 new layer tests (9 total)
- `src/pages/WheelPage.tsx` — Added four new props to CategorySlider render call inside map
- `src/components/WheelPage.test.tsx` — Updated CategorySlider mock with new prop types and data attributes, 5 new wiring tests (42 total)

## Decisions Made

- **Recharts per-Radar data not supported in v3**: The plan's first approach (per-Radar `data` prop) triggered TypeScript errors — `Property 'data' does not exist on type RadarProps`. Switched to the fallback approach specified in the plan: merged dataset with extra numeric keys (`asisImportant`, `asisHighlight`). Tests pass and TypeScript is clean.
- **Star button via IIFE in JSX**: The conditional star button has 4 local derived variables (isFree, atLimit, disabled, tooltipTitle). An IIFE keeps them inline without extracting a named sub-component for a single-use pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Switched from per-Radar data prop to merged dataset**
- **Found during:** Task 3 (WheelChart layers) — npm run build
- **Issue:** Recharts v3 `Radar` component type does not include a `data` prop. TypeScript error TS2322 on both extra Radar elements. The plan noted this possibility and specified the fallback.
- **Fix:** Extended the chart dataset type (`ExtendedChartPoint`) with `asisImportant` and `asisHighlight` numeric fields. Each is pre-computed from the input data. The two extra Radars reference these dataKeys instead of per-component data.
- **Files modified:** `src/components/WheelChart.tsx`
- **Verification:** All 9 WheelChart tests pass; TypeScript build clean for WheelChart
- **Committed in:** `0a30d82` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - implementation approach switched per plan's own fallback guidance)
**Impact on plan:** Zero scope change. Exact same visual output, same test coverage, same interface.

## Issues Encountered

- Pre-existing TypeScript error in `src/hooks/useWheel.ts` (line 225) — unrelated to this plan's changes. Present before and after plan execution. Deferred per scope boundary rule.

## Next Phase Readiness

- POLISH-04 complete: premium users can mark up to 3 important categories, star toggle is wired end-to-end from UI to Supabase via `updateCategoryImportant`
- WheelChart important layer visually elevates marked categories in amber-700; hover highlight in amber-400 gives per-category focus
- All 205 tests green (1 todo, 1 pre-existing async cleanup warning in ActionItemList.test.tsx)

---
*Phase: 07-action-items-and-wheel-polish*
*Completed: 2026-03-16*
