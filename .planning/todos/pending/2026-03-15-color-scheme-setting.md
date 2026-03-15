---
created: 2026-03-15T10:48:40.635Z
title: Color scheme setting
area: ui
files:
  - src/pages/WheelPage.tsx
  - src/components/WheelChart.tsx
---

## Problem

The app uses a fixed stone/neutral Tailwind palette with no way for users to personalize it. Users may want to match the wheel colors to their own preferences or branding.

## Solution

Add a color scheme option in a Settings page (to be created). Options:
- Predefined palettes (e.g. stone/neutral, blue, green, warm)
- Stored in user profile or localStorage
- Applied to WheelChart segment colors and/or overall UI accent color
- Decision needed: per-wheel color scheme vs. global app setting
