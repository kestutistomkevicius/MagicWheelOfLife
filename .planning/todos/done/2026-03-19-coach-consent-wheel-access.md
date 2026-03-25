---
created: 2026-03-19T00:00:00.000Z
title: Coach (admin) can view wheels where user gave consent
area: admin
files:
  - supabase/migrations/
  - src/pages/AdminCoachView.tsx
---

## Problem

As a coach (admin), I need to see the wheels and tasks of users who have explicitly consented to share their data with me. Currently there is no consent mechanism and no coach view.

## Solution

- Add a **consent flag** per wheel (or per user): `coach_access: boolean` — users can toggle this from their wheel or settings
- Admin/coach view: lists all wheels where `coach_access = true`, grouped by user
- Shows wheel scores, categories, and action items (read-only)
- RLS policy: admin role can SELECT where `coach_access = true`

## Notes

- Consent should be opt-in, clearly communicated in the UI
- This is related to the coach-referred user flow described in `idea.md`
- Needs grooming before implementation to align on consent UX
