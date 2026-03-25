---
created: 2026-03-15T13:09:41.268Z
title: Mock tier switching free to premium
area: ui
files: []
---

## Problem

During Phase 4 testing it was cumbersome to verify free vs. premium tier behaviour — required switching between two seed accounts. There is no in-app way for a developer or tester to toggle their own tier without hitting the database directly.

In production this will be driven by payment integration, but that is deferred. Until then there is no way to test tier-gated flows (wheel creation limit, future premium-only features) without manual DB edits.

## Solution

Add a dev/settings UI (e.g. a toggle in the Settings page or a hidden dev panel) that lets the currently signed-in user switch their `profiles.tier` between `free` and `premium`. Should only be visible in local/dev environment (not production). Pairs with Phase 7 payment integration work where the mock toggle gets replaced by real billing logic.
