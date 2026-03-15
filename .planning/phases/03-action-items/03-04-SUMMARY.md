---
phase: 03-action-items
plan: 04
subsystem: ui
tags: [react, typescript, tailwind, vitest, testing-library, shadcn]

# Dependency graph
requires:
  - phase: 03-action-items-03
    provides: useActionItems hook with all CRUD operations
  - phase: 03-action-items-01
    provides: ActionItemRow type, Checkbox component
provides:
  - ActionItemList component with add/toggle/deadline/delete UI
  - Full optimistic-update pattern for action item CRUD
  - 11 passing tests covering all ACTION-01 through ACTION-04 behaviors
affects: [03-05, WheelPage integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Props-down/callbacks-up: component receives items array and onItemsChange from parent (WheelPage owns state)
    - Optimistic UI: local callback fired before Supabase await to prevent perceived lag
    - shadcn Checkbox mocked as native input in tests for jsdom compatibility

key-files:
  created:
    - src/components/ActionItemList.tsx
  modified:
    - src/components/ActionItemList.test.tsx

key-decisions:
  - "ActionItemList has no internal item state — WheelPage owns the actionItemsByCategory map; component is purely presentational+callback"
  - "Optimistic toggle and delete: onItemsChange fires before awaiting Supabase so UI updates instantly"
  - "Add button hidden at items.length >= 7; enforced both in hook (error return) and in UI (button absent)"
  - "Date input uses value={item.deadline ?? ''} pattern — null renders as empty string, ISO string renders as-is"
  - "Checkbox onCheckedChange receives CheckedState (boolean | 'indeterminate') — always use item.is_complete value not checked param to avoid stale closure"

patterns-established:
  - "Optimistic-then-persist: update parent state via callback, then await Supabase call"
  - "Test deviation fix (Rule 1): date input queried via document.querySelectorAll not getByRole — date inputs have no textbox role in jsdom"

requirements-completed: [ACTION-01, ACTION-02, ACTION-03, ACTION-04]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 3 Plan 04: ActionItemList Component Summary

**Props-driven ActionItemList with optimistic add/toggle/deadline/delete, Checkbox integration, and 11 passing TDD tests covering all four ACTION requirements**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T09:33:43Z
- **Completed:** 2026-03-15T09:41:00Z
- **Tasks:** 1 (TDD: RED + GREEN phases)
- **Files modified:** 2

## Accomplishments

- Created ActionItemList.tsx with full CRUD UI — add item on Enter, toggle with line-through, date picker per item, delete button
- All 11 test assertions passing; full suite (74 tests across 10 files) green
- TypeScript compiles cleanly with no errors

## Task Commits

Each task was committed atomically (TDD has two commits):

1. **Task 1 RED: Failing tests** - `ed0abf2` (test)
2. **Task 1 GREEN: Implementation** - `25732de` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD tasks have two commits: test (RED) then feat (GREEN)_

## Files Created/Modified

- `src/components/ActionItemList.tsx` - Per-category action item list component; exports ActionItemList; uses useActionItems hook internally; props: categoryId, userId, items, onItemsChange
- `src/components/ActionItemList.test.tsx` - 11 test cases replacing Wave 0 stubs; covers add (< 7 / = 7 boundary), deadline (null / ISO value), toggle (checked state, line-through, callback), delete (optimistic DOM removal, correct id)

## Decisions Made

- Component is purely presentational with callbacks — WheelPage (Plan 05) will own the actionItemsByCategory state map
- Optimistic pattern: `onItemsChange` fires synchronously before Supabase await, giving instant UI response
- Checkbox onCheckedChange always uses `item.is_complete` from closure rather than the `checked` param to avoid CheckedState indeterminate type ambiguity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test using getByRole('textbox') for date input**
- **Found during:** Task 1 GREEN (running tests)
- **Issue:** Test stub used `screen.getByRole('textbox', { hidden: true })` but `<input type="date">` has no textbox role in jsdom — the query threw before reaching the working querySelector assertion
- **Fix:** Removed the bad getByRole line; test now only uses `document.querySelectorAll('input[type="date"]')` which correctly finds date inputs
- **Files modified:** src/components/ActionItemList.test.tsx
- **Verification:** Test passes; all 11 assertions green
- **Committed in:** 25732de (GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test query)
**Impact on plan:** Minor test fix; no scope change; implementation matches plan exactly.

## Issues Encountered

None beyond the test query bug documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ActionItemList is ready to be wired into WheelPage (Plan 05)
- Plan 05 needs to: load items per category via useActionItems.loadActionItems, maintain actionItemsByCategory: Record<categoryId, ActionItemRow[]> state, and pass items + onItemsChange to each ActionItemList
- No blockers

---
*Phase: 03-action-items*
*Completed: 2026-03-15*

## Self-Check: PASSED

- src/components/ActionItemList.tsx — FOUND
- src/components/ActionItemList.test.tsx — FOUND
- .planning/phases/03-action-items/03-04-SUMMARY.md — FOUND
- Commit ed0abf2 (RED tests) — FOUND
- Commit 25732de (GREEN implementation) — FOUND
