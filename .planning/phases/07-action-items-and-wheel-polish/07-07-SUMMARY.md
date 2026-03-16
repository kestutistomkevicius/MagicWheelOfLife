---
plan: 07-07
phase: 07-action-items-and-wheel-polish
status: complete
completed: 2026-03-16
---

# Plan 07-07 Summary: TrendChart action item markers

## What Was Built

Extended TrendChart and TrendPage to show action item markers aligned to snapshot dates.

**Task 1 — TrendChart ReferenceLine markers:**
- New `TrendChartMarker` type exported: `{ date, label, color }`
- Optional `markers` prop on `TrendChartProps`
- Each marker renders a `ReferenceLine` with a DiamondLabel and hover tooltip
- Backward compatible — no markers = chart unchanged

**Task 2 — TrendPage marker computation:**
- Loads action items for selected category via `loadActionItems(cat.id)`
- Completed_at → green #16a34a; overdue deadline → red #dc2626; due soon → amber #d97706
- Only plots markers where action item date matches a snapshot date exactly
- Re-fetches when selectedCategory, snapshots, or categories changes
- Passes markers prop to TrendChart

## Key Files

### key-files.modified
- src/components/TrendChart.tsx — ReferenceLine markers, DiamondLabel, TrendChartMarker type
- src/components/TrendChart.test.tsx — 5 new marker tests
- src/pages/TrendPage.tsx — marker computation useEffect, markers prop wiring
- src/pages/TrendPage.test.tsx — 4 new marker tests (matched, unmatched, green, red)

## Test Results

- Full suite: 213/213 passing, 1 todo

## Commits

- d1b6aa8: feat(07-07): TrendChart ReferenceLine action item markers
- 4134d41: feat(07-07): TrendPage marker computation from action items

## Issues / Deviations

None.
