---
phase: 09-ai-and-premium
plan: 05
subsystem: ui
tags: [react, hooks, streaming, supabase, anthropic, tdd]

# Dependency graph
requires:
  - phase: 09-ai-and-premium
    provides: ai_chat_messages table type (database.ts), Edge Function endpoint, supabase client
provides:
  - useAiChat hook: messages, streaming, proposal, error, sendMessage, retry, loadHistory
affects:
  - 09-06 (AiCoachDrawer consumes useAiChat)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD with vi.fn() streaming mocks using ReadableStream in jsdom
    - Ref-guarded useEffect auto-send pattern for opening AI message
    - Sentinel JSON detection and stripping from streamed assistant text

key-files:
  created:
    - src/hooks/useAiChat.ts
    - src/hooks/useAiChat.test.ts (replaced stubs)
  modified: []

key-decisions:
  - "useAiChat uses historyLoaded state (not ref) to trigger useEffect for auto-send — state triggers re-render, ref does not"
  - "Empty assistant placeholder removed on non-ok response — prevents stale empty bubble on retry"
  - "sendMessageRef pattern: stable ref updated each render to avoid stale closure in auto-send useEffect"
  - "conversationHistory captured via setMessages callback for correct snapshot of prior messages before current turn"

patterns-established:
  - "Streaming test: use ReadableStream with resolver callback + setTimeout(10ms) to allow setStreaming(true) to be observed mid-flight without act() wrapper"

requirements-completed:
  - AI-01

# Metrics
duration: 6min
completed: 2026-03-20
---

# Phase 9 Plan 05: useAiChat Hook Summary

**React hook implementing per-category AI coaching: ReadableStream token accumulation, score_proposal sentinel detection/stripping, DB persistence, auto-open greeting, and error/retry**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-20T06:57:47Z
- **Completed:** 2026-03-20T07:03:54Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- `useAiChat` hook fully implemented and exported from `src/hooks/useAiChat.ts`
- All 11 tests pass covering: initial state, user message append, streaming state, token accumulation, proposal detection, sentinel stripping, DB persistence (user + assistant), error handling, retry, loadHistory, auto-send opening message
- Full test suite green (271 tests across 26 files); `npm run build` exits 0

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests for useAiChat** - `ed10d5b` (test)
2. **GREEN: Implement useAiChat hook** - `e0509a0` (feat)

_Note: TDD plan — two commits per task (test then implementation)_

## Files Created/Modified
- `src/hooks/useAiChat.ts` - Full hook implementation with streaming, sentinel, DB persistence, auto-send
- `src/hooks/useAiChat.test.ts` - 11 tests replacing the Wave 0 stubs

## Decisions Made
- `historyLoaded` uses `useState` not `useRef` because the auto-send `useEffect` must be triggered by state change — refs do not cause re-renders
- Empty assistant placeholder is removed when fetch returns non-ok status — prevents stale empty bubble that would be found before the retry's real assistant message
- `sendMessageRef` ref updated on every render so the `useEffect` callback always calls the latest closure of `sendMessage` without needing it in the dependency array
- `conversationHistory` array is built inside a `setMessages` callback (for accurate snapshot before this turn's user bubble lands) — avoids race between async state update and the fetch body

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Simplified streaming test from controller-based to timeout-based approach**
- **Found during:** Task 1 (GREEN implementation)
- **Issue:** `ReadableStream` with external controller + multiple `act()` flushes timed out at 5000ms in jsdom; controller.close() was not reliably seen by the reader loop
- **Fix:** Rewrote streaming test to use a `ReadableStream` with an internal `resolveBody` resolver + `setTimeout(10ms)` to let the fetch microtask resolve and `setStreaming(true)` fire before checking state
- **Files modified:** `src/hooks/useAiChat.test.ts`
- **Verification:** All 11 tests pass, no timeouts
- **Committed in:** e0509a0 (Task 1 GREEN commit)

**2. [Rule 1 - Bug] Remove empty assistant placeholder on non-ok response**
- **Found during:** Task 1 (GREEN implementation — retry test failing)
- **Issue:** When fetch returned non-ok, the empty assistant placeholder appended before the fetch remained in `messages`. On retry, `messages.find(role==='assistant')` found the stale empty bubble instead of the new assistant reply.
- **Fix:** Added `setMessages` call on non-ok path to splice out the last empty assistant entry before returning
- **Files modified:** `src/hooks/useAiChat.ts`
- **Verification:** retry test passes — `assistant.content === 'Retry response'`
- **Committed in:** e0509a0 (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs found during GREEN implementation)
**Impact on plan:** Both fixes necessary for correctness — streaming test reliability and retry UX. No scope creep.

## Issues Encountered
- TypeScript error `Expected 1 arguments, but got 0` on `useRef<fn type>()` — fixed by providing explicit `undefined` initial value: `useRef<... | undefined>(undefined)`

## Next Phase Readiness
- `useAiChat` hook ready for consumption by `AiCoachDrawer` (Plan 06)
- Hook public API matches `AiCoachDrawer` expected interface exactly (messages, streaming, proposal, error, sendMessage, retry, loadHistory)
- No blockers

---
*Phase: 09-ai-and-premium*
*Completed: 2026-03-20*
