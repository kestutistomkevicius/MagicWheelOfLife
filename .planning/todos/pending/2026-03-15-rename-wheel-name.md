---
created: 2026-03-15T00:11:41.164Z
title: Rename wheel name
area: ui
files:
  - src/pages/WheelPage.tsx
  - src/hooks/useWheel.ts
---

## Problem

Wheel names are set at creation time but cannot be changed afterwards. The wheel name is displayed as a heading (or dropdown when multiple wheels exist) in WheelPage, but there is no edit affordance. Users who mistype a name or want to rename a wheel (e.g. "My Wheel" → "Work-Life Balance 2026") are stuck.

## Solution

Add inline rename: clicking the wheel name (h2 or select label) switches to an editable input. On blur/Enter, call `supabase.from('wheels').update({ name })`. A small pencil icon next to the name could also trigger it. Update the `wheels` array in hook state after success.
