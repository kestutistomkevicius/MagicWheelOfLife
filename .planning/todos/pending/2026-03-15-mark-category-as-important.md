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

Users want to flag certain life areas as high priority. There is currently no way to mark a category as important, and the wheel chart treats all categories equally visually. This is a **premium-only** feature — free users cannot mark categories as important.

## Solution

- Add `is_important` boolean column to the `categories` table (migration + RLS)
- Premium users can mark up to 3 categories as most important
- Add a toggle (star icon or similar) to CategorySlider — hidden/disabled for free tier users
- Update WheelChart to visually distinguish important categories — e.g. bolder segment outline, accent color, or star marker on the label
- Enforce the 3-category cap in both UI and backend (RLS or Edge Function)
