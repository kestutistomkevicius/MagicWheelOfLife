---
created: 2026-03-15T15:09:35.173Z
title: Show action items as markers on trend chart
area: ui
files:
  - src/components/TrendChart.tsx
  - src/pages/TrendPage.tsx
---

## Problem

The trend chart shows score history over time but has no connection to the action items the user created. It would be valuable to see when action items were due/completed relative to score changes — e.g. "did completing this action item correlate with a score improvement?"

## Solution

Overlay action items as diamond (◆ rhombus) markers on the X-axis (at their due date or completion timestamp):

- **Green diamond** — action item completed
- **Yellow/amber diamond** — due date is approaching (within ~7 days)
- **Red diamond** — overdue (past due date, not completed)

Markers should be per-category (only show action items for the currently selected category). Tooltip on hover should show the action item text.
