---
created: 2026-03-15T15:09:35.173Z
title: Add wheel selector to TrendPage
area: ui
files:
  - src/pages/TrendPage.tsx
  - supabase/seed.sql
---

## Problem

TrendPage currently shows trends for only one wheel (the first/active wheel). Premium users can have multiple wheels, but:
1. There is no way to switch which wheel's trends are displayed
2. The test seed data only creates snapshots for the premium user's first wheel — 2nd and subsequent wheels have no snapshot history, making trends inaccessible even if a selector existed

## Solution

1. Add a wheel dropdown to TrendPage (alongside the existing category dropdown) so users can select which wheel to view trends for
2. Update the Supabase seed data to add snapshots for premium users' additional wheels so trends are testable end-to-end
