---
phase: 07-action-items-and-wheel-polish
plan: 04
subsystem: frontend-components
tags: [animation, modal, ux, action-items, tailwind, radix-ui]
dependency_graph:
  requires: [07-02]
  provides: [celebrate-row-animation, completion-modal, completed-items-table]
  affects: [ActionItemList, WheelPage]
tech_stack:
  added: []
  patterns: [celebration-state-with-timeout-ref, optimistic-update, radix-dialog-mock-pattern]
key_files:
  created: []
  modified:
    - src/components/ActionItemList.tsx
    - src/components/ActionItemList.test.tsx
    - src/index.css
    - tailwind.config.ts
decisions:
  - "Completed items rendered in table (not active list) — architectural split of activeItems vs completedItems requires updating ACTION-03 tests to reflect new structure"
  - "Pre-existing TS error in useWheel.ts (line 225) is out-of-scope deferred item — existed before plan 07-04"
metrics:
  duration: 28min
  completed: 2026-03-16
  tasks_completed: 2
  files_modified: 4
requirements_satisfied:
  - POLISH-01
  - POLISH-08
---

# Phase 7 Plan 4: Celebration Animation, Completion Modal, and Completed Items Table Summary

**One-liner:** Extended ActionItemList with 800ms celebrate-row animation on completion, Radix Dialog note modal ("Great work!"), and collapsed completed items table with Reopen — all driven by activeItems/completedItems split.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CSS keyframes + celebration animation + completion modal | eb62d46 | src/index.css, tailwind.config.ts, src/components/ActionItemList.tsx, src/components/ActionItemList.test.tsx |
| 2 | Completed items table section | eb62d46 | src/components/ActionItemList.tsx, src/components/ActionItemList.test.tsx |

Tasks 1 and 2 were committed together as a single atomic unit since they extend the same component in an interlocked way.

## What Was Built

### CSS keyframes + Tailwind animations

Added `@keyframes celebrate-row` and `@keyframes category-glow` to `src/index.css`. Extended `tailwind.config.ts` theme with matching keyframes + animation utilities (`animate-celebrate-row`, `animate-category-glow`).

### ActionItemList — complete rewrite

**State additions:**
- `celebrating: string | null` — tracks which item is animating; cleared after 800ms via `useRef` timeout
- `completionPending: string | null` — which item's completion modal is open
- `noteText: string` — textarea value inside modal
- `completedExpanded: boolean` — toggle for completed section

**Architecture change:** Items split into `activeItems` and `completedItems`. Active items render in the existing flex list with checkboxes. Completed items render in a separate collapsible table section. The 7-item cap now uses `activeItems.length` instead of `items.length`.

**handleToggle split:**
- Completing (currentValue=false): sets celebrating state, opens modal, fires optimistic update with `completed_at: new Date().toISOString()`, calls `toggleActionItem({ isComplete: true })`
- Un-completing (currentValue=true): existing behavior (no modal)

**Completion modal** (Radix Dialog):
- Title: "Great work!"
- Optional textarea (max 500 chars, `aria-label="Note"`)
- "Save note" button: calls `saveCompletionNote`, closes modal
- "Skip" button: closes modal without note
- `onOpenChange` handler clears state on close

**Completed items table:**
- Toggle button: "X completed ▼/▲" (only rendered when completedItems.length > 0)
- Collapsed by default
- Columns: Task (line-through) | Completed (DD Mon YYYY format) | Note | Reopen button
- Reopen: optimistic update sets `is_complete: false, completed_at: null, note: null`, then calls `reopenActionItem(id)`

### Tests

22 tests total (up from 12). New tests cover:
- Celebration animation class applied on check and cleared after 800ms (fake timers)
- Completion modal opens with "Great work!" title
- Reopen instead of un-check for completed items (architecture-driven test update)
- saveCompletionNote called with correct args on Save
- Skip closes modal without saveCompletionNote
- Active-items cap uses activeItems.length (not total)
- Completed table toggle/expand/collapse
- Completed date format, note display
- Reopen calls reopenActionItem with correct id
- Optimistic update moves item back to active list

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated ACTION-03 tests to match new architecture**
- **Found during:** Task 1 GREEN phase
- **Issue:** Pre-existing tests "renders Checkbox checked when item.is_complete is true" and "item text has line-through class" used `is_complete: true` items, which now go to the completed table (not the active list with checkboxes). Tests were failing because no checkbox role existed in the active list for completed items.
- **Fix:** Replaced the two tests with architecture-correct equivalents: one verifying completed items appear in the completed table, one verifying line-through text in the expanded table. Updated "does NOT open completion modal when un-checking" to use Reopen button flow instead of checkbox click.
- **Files modified:** src/components/ActionItemList.test.tsx
- **Commit:** eb62d46

### Deferred Items (out of scope)

- Pre-existing TypeScript error in `src/hooks/useWheel.ts` line 225 — `upsert` call with position-only objects. This error existed in commit 5bba0b6 before plan 07-04. Logged but not fixed (Rule: only fix issues caused by current task's changes).

## Verification Results

- `npm test -- --run ActionItemList`: 22/22 passed
- `npm test -- --run`: 155 passed, 9 todo, 1 skipped (DueSoonWidget stubs) — all green
- `npm run build`: pre-existing TypeScript error in useWheel.ts line 225 (out of scope)

## Self-Check: PASSED

- eb62d46 exists: confirmed (`git log --oneline -1`)
- `src/components/ActionItemList.tsx` modified: confirmed
- `src/components/ActionItemList.test.tsx` modified: confirmed (22 tests)
- `src/index.css` modified with keyframes: confirmed
- `tailwind.config.ts` modified with animation utilities: confirmed
