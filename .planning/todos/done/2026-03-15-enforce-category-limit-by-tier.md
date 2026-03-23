---
created: 2026-03-15T22:20:00.000Z
title: Enforce category limit by tier
area: ui
files:
  - src/pages/WheelPage.tsx
  - supabase/migrations/
---

## Problem

The app currently allows unlimited categories per wheel regardless of plan. Per the pricing model:
- **Free tier:** 3–8 categories per wheel (min 3, max 8)
- **Premium tier:** 3–12 categories per wheel (min 3, max 12)

The "Add category" button must be disabled once the limit is reached, with a clear message explaining the tier limit and an upgrade prompt for free users.

## Solution

- Check user tier before allowing category creation
- Disable "Add category" in WheelPage when the tier cap is reached
- Show a tooltip/message: "Upgrade to Premium for up to 12 categories" for free users at the 8-category cap
- Enforce the limit server-side (RLS check or Edge Function) to prevent API bypass
- Min of 3 categories remains enforced for both tiers (already implicit in domain model)
