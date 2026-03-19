---
created: 2026-03-19T00:00:00.000Z
title: Delete wheel and delete snapshot
area: ui
files:
  - src/pages/WheelPage.tsx
  - src/pages/SnapshotsPage.tsx
  - src/hooks/useWheel.ts
---

## Problem

Users can create wheels and snapshots but cannot delete them. There is no way to clean up old or unwanted data.

## Solution

- **Delete wheel**: Confirmation dialog → deletes wheel and all its categories, action items, and snapshots. If it was the only wheel, redirect to a "create your first wheel" state.
- **Delete snapshot**: Per-snapshot delete action on the Snapshots page (e.g. kebab menu or trash icon). Confirmation dialog before deleting.

## Notes

- Cascade deletes should be handled at the DB level via FK constraints or explicit migration
- Premium users with multiple wheels: deleting a wheel should not leave them with zero wheels without guidance
