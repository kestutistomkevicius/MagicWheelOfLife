---
created: 2026-03-19T00:00:00.000Z
title: All tasks page (needs grooming before implementation)
area: ui
files:
  - src/pages/AllTasksPage.tsx
---

## Problem

Action items (tasks) are currently only visible within the context of a specific wheel/category. There is no unified view of all tasks across all wheels and categories.

## Needs Grooming

This feature needs product design before implementation. Questions to answer:

- **Scope**: Tasks from the current wheel only, or all wheels?
- **Grouping**: By wheel → category, by due date, by status (complete/incomplete)?
- **Filtering**: Filter by wheel, category, overdue, upcoming?
- **Actions**: Can tasks be marked complete, edited, or deleted from this view?
- **Navigation**: Where does this live — new sidebar item, or accessible from dashboard/wheel page?
- **Mobile**: Is this a priority for mobile layout?
- **Relation to coach view**: Should the coach also see a client's task list?

## Notes

⚠️ Do NOT implement until grooming session with founder has produced a clear spec.
