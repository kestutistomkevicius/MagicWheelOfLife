---
created: 2026-03-16T21:45:00.000Z
title: Fix POLISH-02 hover highlight — category not highlighting in wheel chart
area: ui
files:
  - src/components/WheelChart.tsx
  - src/components/DueSoonWidget.tsx
  - src/pages/WheelPage.tsx
---

## Problem

Hovering over a due-soon item in DueSoonWidget should highlight the corresponding category axis in the WheelChart (amber fill overlay). The fix to always mount the Highlighted Radar layer (instead of conditional mount) was attempted but hover still does not visually highlight the category in the browser.

The wiring looks correct in code: DueSoonWidget.onMouseEnter → onHighlight(categoryName) → setHighlightedCategory → WheelChart.highlightedCategory → asisHighlight = d.asis for matching category → Highlighted Radar renders.

Possible causes to investigate:
- Recharts RadarChart does not re-render when data prop changes (known issue — may need `key` prop or animation={false})
- `categoryName` in DueSoonItem vs `category` in chartData may not match exactly (case, whitespace)
- React state update batching causing WheelChart to not receive updated prop
- ResponsiveContainer caching preventing re-render

## Solution

1. Add `console.log` to verify `highlightedCategory` prop reaches WheelChart and `asisHighlight` is non-zero
2. Try adding `animation={false}` to all Radar components (Recharts animation can mask data updates)
3. Try adding `key={highlightedCategory ?? 'none'}` to RadarChart to force remount on hover
4. Verify categoryName string matches exactly between DueSoonItem and chartData
