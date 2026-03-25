---
created: 2026-03-15T10:48:40.635Z
title: Delete action items
area: ui
files:
  - src/components/ActionItemList.tsx
  - src/hooks/useActionItems.ts
---

## Problem

Wait, action items already have a delete (×) button implemented in Phase 3. This todo may refer to something different — possibly bulk delete, delete from the "soon expiring" widget, or deleting completed items in batch.

## Solution

Clarify with user what "task could be deleted" means in context. Options:
- Bulk delete all completed items ("clear completed")
- Delete from the soon-expiring widget directly
- Swipe-to-delete on mobile
