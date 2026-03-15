---
created: 2026-03-15T10:48:40.635Z
title: Mark category as important
area: ui
files:
  - src/components/CategorySlider.tsx
  - src/components/WheelChart.tsx
  - supabase/migrations/
  - src/types/database.ts
---

## Problem

Users want to flag certain life areas as high priority. There is currently no way to mark a category as important, and the wheel chart treats all categories equally visually.

## Solution

- Add `is_important` boolean column to the `categories` table (migration + RLS)
- Add a toggle (star icon or similar) to CategorySlider
- Update WheelChart to visually distinguish important categories — e.g. bolder segment outline, accent color, or star marker on the label
