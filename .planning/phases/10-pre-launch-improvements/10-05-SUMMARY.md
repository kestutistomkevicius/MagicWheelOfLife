---
plan: "10-05"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Extended WheelChart customTick to render an SVG spoke line when a category is highlighted (due-soon indicator).

## What Was Built

- Updated `customTick` in `WheelChart.tsx` to return a `<g>` with a conditional `<line>` SVG element from chart center to tick position when `highlightedCategory` matches
- Line and label text color change simultaneously using `highlightColor`
- Non-highlighted axes render identically (no regression)
- 2 passing tests in `WheelChart.test.tsx` verifying spoke line presence/absence

## Self-Check

- [x] Highlighted category renders `<line>` from center to tick ✓
- [x] Non-highlighted category renders no `<line>` ✓
- [x] `npm test -- --run src/components/WheelChart.test.tsx` passes ✓
- [x] `npm run build` passes ✓

## Key Files

### Modified
- `src/components/WheelChart.tsx` — customTick extended with conditional `<line>` SVG element
- `src/components/WheelChart.test.tsx` — 2 passing tests for spoke highlight behavior
