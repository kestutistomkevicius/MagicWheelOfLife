---
created: 2026-03-15T15:09:35.173Z
updated: 2026-03-17T09:24:06.413Z
title: Rethink trend chart action markers — inspirational progress story
area: ui
files:
  - src/components/TrendChart.tsx
  - src/pages/TrendPage.tsx
---

## Problem

The current implementation (POLISH-03) shows ◆ markers only when an action item's deadline or completion date falls on the **exact same calendar day** as a snapshot. This is too simplistic — dates rarely align by chance, so markers almost never appear. It provides no meaningful value as implemented.

User's vision: the trend chart should help users see **what actions led to score improvements in the past**, serving as an inspirational and motivational tool — "I completed these actions and my score went up by 2 points".

## Solution

Rethink the feature entirely. Ideas to explore:

- **Between-snapshot annotation**: Show completed action items in the *interval between two snapshots* where a score improvement occurred — connect actions to outcomes rather than exact dates.
- **Score delta context**: When a score increased between two snapshots, list the action items that were completed during that period alongside the chart.
- **Timeline view**: Instead of (or in addition to) the line chart, offer a vertical timeline showing snapshots and the actions completed between them.

The key UX goal: user reads the chart, sees a positive spike, and can immediately understand *why* the score improved — creating a feedback loop of motivation.
