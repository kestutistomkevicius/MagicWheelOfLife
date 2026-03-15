---
phase: 03-action-items
plan: 03
subsystem: api
tags: [react, supabase, typescript, hooks, vitest, tdd]

# Dependency graph
requires:
  - phase: 03-action-items-01
    provides: ActionItemRow type in database.ts, Wave 0 test stubs
  - phase: 03-action-items-02
    provides: action_items table migration with RLS, seed data
provides:
  - useActionItems hook with loadActionItems, addActionItem, toggleActionItem, setDeadline, deleteActionItem
  - UseActionItemsResult TypeScript interface
  - 8 passing unit tests with mocked Supabase (buildChain pattern)
affects: [03-04-action-items, 03-05-action-items, 03-06-action-items]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.hoisted() for Vitest mock variables referenced inside vi.mock() factory"
    - "buildChain() helper: fluent Supabase chain with .then for await support, mirrors useCategories.test.ts pattern"
    - "useActionItems mirrors useCategories exactly: stateless hook, no local state, pure mutations"

key-files:
  created:
    - src/hooks/useActionItems.ts
  modified:
    - src/hooks/useActionItems.test.ts

key-decisions:
  - "vi.hoisted() required for top-level mock variables when vi.mock() factory is hoisted — plain const declarations fail with 'Cannot access before initialization'"
  - "buildChain() test helper used instead of individual vi.fn() mocks — supports both chainable calls and thenable await in a single object"
  - "setDeadline accepts string | null (not empty string) — caller converts empty string to null before calling hook, matching plan spec"

patterns-established:
  - "Pattern: buildChain() for Supabase mock — fluent chain with .then, vi.fn() per step, reusable across tests"
  - "Pattern: vi.hoisted() for shared mock state in vi.mock() factories"

requirements-completed: [ACTION-01, ACTION-02, ACTION-04]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 3 Plan 03: useActionItems Hook Summary

**Stateless useActionItems hook with 5 Supabase CRUD functions — 7-item guard, null deadline handling, 8 passing TDD tests using buildChain mock pattern**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-15T09:29:00Z
- **Completed:** 2026-03-15T09:31:30Z
- **Tasks:** 1 (TDD: RED + GREEN phases)
- **Files modified:** 2

## Accomplishments
- Implemented `useActionItems` hook with all 5 functions matching the RESEARCH.md Pattern 2 spec exactly
- Replaced 8 `it.todo` stubs with real assertions using a mocked Supabase client
- All 8 tests pass with no regressions (63 total passing in full suite)
- TypeScript compiles without errors (`npx tsc --noEmit` clean)

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `59fded4` (test)
2. **GREEN: Implementation + fixed tests** - `009ff6f` (feat)

_Note: TDD task has two commits (test RED → feat GREEN). Test file was updated in GREEN commit to fix Vitest mock hoisting issue discovered during implementation._

**Plan metadata:** (committed after SUMMARY creation)

## Files Created/Modified
- `src/hooks/useActionItems.ts` - useActionItems hook with loadActionItems, addActionItem, toggleActionItem, setDeadline, deleteActionItem; exports UseActionItemsResult interface
- `src/hooks/useActionItems.test.ts` - 8 unit tests using vi.hoisted() + buildChain() mock pattern

## Decisions Made
- **vi.hoisted() required:** The plan's suggested mock setup (top-level `const mockFrom = vi.fn()` referenced inside `vi.mock()` factory) fails in Vitest because `vi.mock` is hoisted to the top of the file, before `const` declarations are initialized. Fixed by wrapping all mock variables in `vi.hoisted()`.
- **buildChain() helper:** Individual `vi.fn()` mocks with `mockReturnThis()` cannot simultaneously support chaining AND thenable await. A single chain object with a `.then` property solves both requirements cleanly — mirrors the pattern already used in `useCategories.test.ts`.
- **Test file updated in GREEN commit:** The RED commit had the correct test intent but used a mock pattern that failed at runtime. The mock structure was fixed in the GREEN commit alongside the implementation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vitest mock hoisting failure in test file**
- **Found during:** Task 1 GREEN phase (after implementation file was created)
- **Issue:** Plan's suggested mock setup (`const mockEq = vi.fn()` at top level, referenced in `vi.mock()` factory) fails with "Cannot access before initialization" because `vi.mock()` is hoisted above const declarations.
- **Fix:** Replaced individual top-level mock variables with `vi.hoisted()` wrapper; then switched to `buildChain()` helper pattern (matching `useCategories.test.ts`) for cleaner chainable mock support.
- **Files modified:** `src/hooks/useActionItems.test.ts`
- **Verification:** All 8 tests pass, full suite green (63 tests), TypeScript clean.
- **Committed in:** `009ff6f` (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test mock setup)
**Impact on plan:** Fix required for tests to run at all. Implementation itself follows plan exactly. No scope creep.

## Issues Encountered
- Vitest mock hoisting: `vi.mock()` factory runs before top-level `const` initializations. Solution: `vi.hoisted()` or inline `vi.fn()` inside the factory. Switched to `buildChain()` pattern (already established in `useCategories.test.ts`) for full chain + thenable support.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useActionItems` hook is complete and ready to be consumed by `ActionItemList` component (Plan 04)
- All 5 functions tested: load, add (with 7-item guard), toggle, setDeadline (null handling), delete
- TypeScript interfaces exported for use in Plan 04/05 components

---
*Phase: 03-action-items*
*Completed: 2026-03-15*
