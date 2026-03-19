---
phase: 09-ai-and-premium
plan: 01
subsystem: testing
tags: [vitest, test-stubs, wave-0, ai-coach, color-scheme, palette]

# Dependency graph
requires: []
provides:
  - it.todo stub file for useAiChat hook (AI-01 streaming, proposal detection, DB persistence, retry, history)
  - it.todo stub file for AiCoachDrawer component (thread rendering, proposal card, apply buttons, streaming state, error/retry, close)
  - it.todo stub file for ColorSchemePicker component (swatch grid, aria-pressed, onSelect, lock overlay, upgrade prompt, premium access)
  - it.todo stub file for PaletteContext (CSS var application per token, usePalette hook, PaletteProvider mount/update, fallback)
affects:
  - 09-03 (implements useAiChat — stubs become real tests)
  - 09-04 (implements AiCoachDrawer — stubs become real tests)
  - 09-05 (implements ColorSchemePicker — stubs become real tests)
  - 09-06 (implements PaletteContext — stubs become real tests)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 stub pattern: import only describe/it from vitest, use only it.todo — no feature module imports so stubs survive until implementation plans run"

key-files:
  created:
    - src/hooks/useAiChat.test.ts
    - src/components/AiCoachDrawer.test.tsx
    - src/components/ColorSchemePicker.test.tsx
    - src/contexts/PaletteContext.test.tsx
  modified: []

key-decisions:
  - "Wave 0 stub pattern continues from Phase 8: import only describe/it from vitest, use only it.todo — no actual module imports needed, stubs survive until implementation plans run"

patterns-established:
  - "Phase 09 Wave 0 stubs: same pattern established in Phases 02, 03, 04, 06, 08 — consistent Nyquist compliance approach"

requirements-completed: [AI-01, PREMIUM-02]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 9 Plan 01: Wave 0 Test Stubs Summary

**Four it.todo stub files for AI Coach (useAiChat + AiCoachDrawer) and Color Scheme (ColorSchemePicker + PaletteContext) — 37 total named test stubs, full suite green at 244 passing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-19T22:53:34Z
- **Completed:** 2026-03-19T22:58:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created useAiChat.test.ts with 10 stubs covering streaming tokens, proposal extraction/strip, DB persistence, retry, and history loading
- Created AiCoachDrawer.test.tsx with 11 stubs covering thread rendering, proposal card with apply buttons, streaming disabled state, error/retry inline, and close
- Created ColorSchemePicker.test.tsx with 6 stubs covering swatch rendering, aria-pressed, onSelect callback, free-tier lock overlay, upgrade prompt, and premium access
- Created PaletteContext.test.tsx with 9 stubs covering CSS var application for all 5 palette tokens, usePalette hook shape, PaletteProvider mount/update lifecycle, and unknown palette fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAiChat and AiCoachDrawer test stubs** - `f0ead05` (test)
2. **Task 2: Create ColorSchemePicker and PaletteContext test stubs** - `e7b8cd3` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useAiChat.test.ts` - 10 it.todo stubs for AI-01 hook behaviors
- `src/components/AiCoachDrawer.test.tsx` - 11 it.todo stubs for AI-01 drawer UI behaviors
- `src/components/ColorSchemePicker.test.tsx` - 6 it.todo stubs for PREMIUM-02 swatch picker behaviors
- `src/contexts/PaletteContext.test.tsx` - 9 it.todo stubs for PREMIUM-02 palette CSS var behaviors

## Decisions Made

Wave 0 stub pattern continues unchanged from Phases 02, 03, 04, 06, and 08: import only `describe` and `it` from vitest, use only `it.todo()` — no feature module imports. Stubs survive until implementation plans run.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 37 new test stubs are named and registered in the suite
- Plans 09-03 through 09-07 can reference these stub files as pre-existing test targets
- Full test suite remains green (244 passing, 37 todo, 0 failing)

---
*Phase: 09-ai-and-premium*
*Completed: 2026-03-19*

## Self-Check: PASSED

- FOUND: src/hooks/useAiChat.test.ts
- FOUND: src/components/AiCoachDrawer.test.tsx
- FOUND: src/components/ColorSchemePicker.test.tsx
- FOUND: src/contexts/PaletteContext.test.tsx
- FOUND: commit f0ead05 (Task 1)
- FOUND: commit e7b8cd3 (Task 2)
