---
phase: 07-action-items-and-wheel-polish
plan: 05
subsystem: ui
tags: [react, typescript, radix, dialog, tdd, vitest]

# Dependency graph
requires:
  - phase: 07-action-items-and-wheel-polish
    provides: useWheel extensions (tier, renameWheel, updateCategoryImportant) from Plan 03; WheelChart stub props from Plan 01; DueSoonWidget stub from Plan 01
provides:
  - Inline wheel rename with Escape/blur guard via skipSaveOnBlurRef
  - Free-tier category count gate showing upgrade prompt at 8 categories
  - Auto-incremented category names via getNextCategoryName()
  - DueSoonWidget: full implementation with hover highlight and mark-complete mini modal
  - WheelChart receives importantCategories and highlightedCategory props
  - Priority counter display (premium only)
  - Auto-prompt nudge dialog for big score gaps (premium, session-dismissed)
affects: [07-06, 07-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - skipSaveOnBlurRef pattern for Escape-vs-blur race in inline edit inputs
    - Handler-gated category ceiling (not disabled prop) so upgrade prompt can fire

key-files:
  created:
    - src/components/DueSoonWidget.tsx
    - src/components/DueSoonWidget.test.tsx
  modified:
    - src/pages/WheelPage.tsx
    - src/components/WheelPage.test.tsx

key-decisions:
  - "skipSaveOnBlurRef = useRef(false) set in Escape branch prevents onBlur from saving after cancel — avoids stale-closure and race between keyDown and blur events in jsdom"
  - "Add category button disabled only at hard ceiling (12) — handler gates at tier-specific limit (8/12) so upgrade prompt is reachable at count=8 for free users"
  - "vi.clearAllMocks() added to beforeEach — mockResolvedValue() resets implementation but not call history; missing reset caused cross-test call count bleed"
  - "getByText(/regex/) used in DueSoonWidget tests — item text is a text node inside a span containing category name + dash, so exact string match fails"

patterns-established:
  - "skipSaveOnBlurRef pattern: set ref to true in Escape keyDown handler; onBlur checks and resets ref before deciding whether to save"
  - "Handler-gating vs disabled-prop: use disabled only for absolute hard ceilings; use handler to gate softer limits with user-facing prompts"

requirements-completed: [POLISH-02, POLISH-04, POLISH-05, POLISH-06, POLISH-07]

# Metrics
duration: 55min
completed: 2026-03-16
---

# Phase 7 Plan 05: WheelPage Polish Summary

**Inline wheel rename, tier-gated category count, DueSoonWidget with hover highlight and mark-complete, importantCategories wiring, priority counter, and auto-nudge for premium score gaps**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-03-16T07:11:00Z
- **Completed:** 2026-03-16T10:05:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- WheelPage inline rename with Enter/blur-save and Escape-cancel using `skipSaveOnBlurRef` guard
- Free-tier users see upgrade prompt at 8 categories; premium users can add up to 12; auto-incremented names via `getNextCategoryName()`
- DueSoonWidget fully implemented: deadline filtering, hover highlight lifted to WheelPage, mini modal with Mark complete; 13 new tests
- WheelChart receives `importantCategories` and `highlightedCategory` props; priority counter shown above sliders for premium tier
- Auto-prompt nudge dialog after scoring a non-important category with |tobe − asis| ≥ 3 (premium only, session-dismissed per category)
- Full suite: 185 tests passing, 0 failures

## Task Commits

1. **Task 1: Inline rename, category gate, auto-naming, priority counter** - `2d73552` (feat)
2. **Task 2: DueSoonWidget implementation + WheelPage integration** - `d826a47` (feat)
3. **Task 3: Nudge dialog tests (POLISH-04)** - `88d3841` (test)

## Files Created/Modified

- `src/pages/WheelPage.tsx` — inline rename, tier gate, getNextCategoryName, DueSoonWidget wiring, importantCategories, priority counter, category upgrade prompt dialog, nudge dialog
- `src/components/WheelPage.test.tsx` — 17 new tests: rename (6), category gate (3), priority counter (2), nudge (6); vi.clearAllMocks() added to beforeEach
- `src/components/DueSoonWidget.tsx` — full implementation replacing stub: getDueSoonItems filter/sort logic, DueSoonWidget with hover events and mini modal
- `src/components/DueSoonWidget.test.tsx` — 13 tests replacing todo stubs: getDueSoonItems (6), DueSoonWidget (7)

## Decisions Made

- **skipSaveOnBlurRef pattern**: Escape sets `skipSaveOnBlurRef.current = true` before `setEditingWheelName(false)`. The blur fires immediately after keyDown in jsdom; `onBlur` checks and resets the ref so it does not call `renameWheel`. This avoids a stale-closure approach (reading state in the blur handler) and works reliably across real browsers too.
- **Handler-gating vs disabled prop**: The Add category button is only `disabled` at 12 (hard ceiling). The handler checks tier-specific limit (8 free / 12 premium) and shows the upgrade prompt. If the button were disabled at 8 for free users, the click never reaches the handler and the prompt cannot fire.
- **vi.clearAllMocks() in beforeEach**: `mockResolvedValue()` resets the mock's return value but not its call history. Without `clearAllMocks()`, call counts from earlier tests bleed into later assertions causing false failures.
- **Regex text matchers in DueSoonWidget tests**: Item text ("Go for a run") is a text node inside a `<span>` that also contains category name and em-dash. `getByText('Go for a run')` fails because no element's complete text equals that string exactly. Using `/Go for a run/` (regex) matches the containing element correctly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.clearAllMocks() added to fix cross-test call count bleed**
- **Found during:** Task 1 (inline rename tests — Escape and empty-blur)
- **Issue:** `mockRenameWheel` call history was not reset between tests. Earlier tests (Enter-save, blur-save) accumulated calls, causing later tests that assert "not called at all" to fail.
- **Fix:** Added `vi.clearAllMocks()` as first line of `beforeEach` in WheelPage.test.tsx.
- **Files modified:** src/components/WheelPage.test.tsx
- **Verification:** All 31 WheelPage tests pass after fix.
- **Committed in:** 2d73552 (Task 1 commit)

**2. [Rule 1 - Bug] Regex text matchers for split-span item text in DueSoonWidget tests**
- **Found during:** Task 2 (DueSoonWidget render tests)
- **Issue:** `getByText('Go for a run')` failed because the item text is rendered inside a span alongside category name and em-dash — no element has that exact complete text.
- **Fix:** Changed to `getByText(/Go for a run/)` (regex partial match).
- **Files modified:** src/components/DueSoonWidget.test.tsx
- **Verification:** All 13 DueSoonWidget tests pass after fix.
- **Committed in:** d826a47 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bug fixes in tests)
**Impact on plan:** Both fixes were test correctness issues, not implementation changes. No scope creep.

## Issues Encountered

- **Escape/blur race**: Pressing Escape in jsdom causes blur to fire immediately after keyDown. Initial implementation (just `setEditingWheelName(false)` in Escape) did not prevent `onBlur` from then saving the edit. Resolved with `skipSaveOnBlurRef`.
- **Category upgrade prompt unreachable**: The button had `disabled={localCategories.length >= (tier === 'premium' ? 12 : 0)}` in an incorrect intermediate state. Corrected to `disabled={localCategories.length >= 12}` so the handler can gate at 8 and show the prompt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WheelPage polish features fully implemented and tested
- WheelChart `highlightedCategory` and `importantCategories` props wired and available for Plan 06 visual rendering
- DueSoonWidget renders correctly; Plan 06 can add visual emphasis without structural changes
- 185 tests green, no blockers

---

## Self-Check: PASSED

Files confirmed present:
- FOUND: src/pages/WheelPage.tsx
- FOUND: src/components/DueSoonWidget.tsx
- FOUND: src/components/WheelPage.test.tsx
- FOUND: src/components/DueSoonWidget.test.tsx

Commits confirmed:
- FOUND: 2d73552 (Task 1)
- FOUND: d826a47 (Task 2)
- FOUND: 88d3841 (Task 3)

---
*Phase: 07-action-items-and-wheel-polish*
*Completed: 2026-03-16*
