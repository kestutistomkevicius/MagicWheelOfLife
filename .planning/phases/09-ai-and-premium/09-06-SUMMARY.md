---
phase: 09-ai-and-premium
plan: 06
subsystem: ui
tags: [react, typescript, tailwind, ai, drawer, chat]

# Dependency graph
requires:
  - phase: 09-05
    provides: useAiChat hook with messages, streaming, proposal, error, sendMessage, retry, loadHistory
provides:
  - AiCoachDrawer component: slide-in right drawer hosting AI coaching chat
  - Proposal card with Apply to As-Is / Apply to To-Be buttons
affects: [09-07, 09-08, WheelPage integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Plain Tailwind drawer (not shadcn Dialog) — consistent with FeatureRequestModal/SnapshotNameDialog pattern for jsdom test compatibility
    - vi.mock('@/hooks/useAiChat') with vi.hoisted for clean hook mocking in component tests

key-files:
  created:
    - src/components/AiCoachDrawer.tsx
    - src/components/AiCoachDrawer.test.tsx (replaced stub)
  modified: []

key-decisions:
  - "AiCoachDrawer uses plain Tailwind backdrop + panel (not Radix Dialog) — matches FeatureRequestModal pattern, avoids jsdom portal issues in tests"
  - "useAiChat called internally by AiCoachDrawer (not passed as prop) — component owns hook instantiation, callers only pass category data and callbacks"
  - "loadHistory called on mount via useEffect with categoryId — restores prior conversation thread before component is visible"

patterns-established:
  - "Hook mock pattern: vi.hoisted() + vi.mock('@/hooks/hookName') returning controlled UseHookResult — same shape as real return value"
  - "Proposal card layout: rounded-lg amber border/bg, two side-by-side Apply buttons calling parent callbacks with proposal values"

requirements-completed: [AI-01]

# Metrics
duration: 12min
completed: 2026-03-20
---

# Phase 9 Plan 06: AiCoachDrawer Summary

**Slide-in right drawer with streaming chat thread, conditional proposal card, and Apply score buttons wired to useAiChat hook — 13 tests pass**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-20T06:42:36Z
- **Completed:** 2026-03-20T06:54:30Z
- **Tasks:** 1 (TDD: test RED + implementation GREEN)
- **Files modified:** 2

## Accomplishments
- AiCoachDrawer component with full Tailwind layout: backdrop, header with category name + close button, scrollable chat thread, optional proposal card, optional error/retry row, send input
- Message bubbles: user messages right-aligned amber, assistant messages left-aligned stone; streaming cursor indicator on last assistant bubble
- Proposal card pinned above send form showing "Suggested scores: As-Is: X · To-Be: Y" with two independent Apply buttons
- Send button disabled while streaming; input clears after send; Enter key submits
- All 13 tests passing, build exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AiCoachDrawer component with full tests** - `6cfaed9` (feat)

**Plan metadata:** (docs commit — see final commit)

_Note: TDD task — tests written first (RED), component implemented to pass (GREEN)_

## Files Created/Modified
- `src/components/AiCoachDrawer.tsx` - Full drawer component with chat thread, proposal card, error/retry, send form
- `src/components/AiCoachDrawer.test.tsx` - 13 tests replacing the it.todo() stub from Plan 01

## Decisions Made
- Used plain Tailwind modal pattern (backdrop div + fixed panel) rather than shadcn Dialog — consistent with FeatureRequestModal, avoids Radix portal issues in jsdom tests
- `useAiChat` instantiated inside AiCoachDrawer (not injected as prop) — simpler API for callers; mocked cleanly in tests via `vi.mock('@/hooks/useAiChat')`
- `loadHistory(categoryId)` called on mount — hook auto-sends opening message if history is empty (behaviour already in useAiChat)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AiCoachDrawer is ready to be integrated into WheelPage (Plan 07)
- Props interface (AiCoachDrawerProps) is exported and stable
- onApplyAsis/onApplyTobe callbacks need to be wired in WheelPage to update category scores

---
*Phase: 09-ai-and-premium*
*Completed: 2026-03-20*
