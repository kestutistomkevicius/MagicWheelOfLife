---
phase: 09-ai-and-premium
plan: "09"
subsystem: integration
tags: [ai-coach, palette, color-scheme, settings, category-slider, wheel-page]
dependency_graph:
  requires: [09-06, 09-07, 09-08, 09-03]
  provides: [AI-01, PREMIUM-01, PREMIUM-02]
  affects: [CategorySlider, WheelPage, SettingsPage]
tech_stack:
  added: []
  patterns: [TDD-red-green, prop-drilling, usePalette-context, IIFE-in-JSX]
key_files:
  created: []
  modified:
    - src/components/CategorySlider.tsx
    - src/components/CategorySlider.test.tsx
    - src/pages/WheelPage.tsx
    - src/pages/SettingsPage.tsx
    - src/pages/SettingsPage.test.tsx
    - src/components/WheelPage.test.tsx
decisions:
  - CategorySlider AI Coach button uses Sparkles icon (lucide) — more visually descriptive of AI/smart features than BrainCircuit
  - WheelPage uses IIFE pattern to find selectedCat before rendering AiCoachDrawer — consistent with existing nudge dialog pattern
  - WheelPage.test.tsx needed PaletteContext and AiCoachDrawer mocks (Rule 2 auto-fix — missing mocks for new dependency)
metrics:
  duration: 520s
  completed: "2026-03-20"
  tasks_completed: 2
  files_modified: 6
---

# Phase 9 Plan 9: Integration Wiring Summary

**One-liner:** Wired AI Coach button in CategorySlider to AiCoachDrawer in WheelPage, passed palette-derived colors to WheelChart, and added ColorSchemePicker + PREMIUM-01 toggle fix to SettingsPage.

## What Was Built

### Task 1: CategorySlider AI Coach button + WheelPage drawer wiring

**CategorySlider.tsx:**
- Added `onAiCoach?: () => void` and `isPremiumForAi?: boolean` props
- Added `Sparkles` icon button in the header row (rendered only when `onAiCoach` is defined)
- Premium users: button calls `onAiCoach()`; free users: shows local upgrade modal (plain Tailwind)
- `showAiUpgrade` boolean state manages the free-user upgrade modal

**WheelPage.tsx:**
- Added `drawerCategoryId: string | null` state; `drawerOpen = drawerCategoryId !== null`
- Imported `usePalette` and `PALETTES` from PaletteContext
- Passes `paletteVars['--palette-primary/secondary/important/highlight']` to WheelChart
- Each CategorySlider receives `onAiCoach={() => setDrawerCategoryId(cat.id)}` and `isPremiumForAi={tier === 'premium'}`
- AiCoachDrawer rendered via IIFE when `drawerCategoryId !== null`, wired to `handleAsisCommit` / `handleTobeCommit`

### Task 2: SettingsPage — ColorSchemePicker + PREMIUM-01 tier toggle fix

**SettingsPage.tsx:**
- Imported `ColorSchemePicker` and `usePalette`
- Destructures `colorScheme, updateColorScheme` from `useProfile`
- Replaced TODO comment with `<ColorSchemePicker>` section: `onSelect` calls `applyPalette(name)` + `void updateColorScheme(name)`
- Fixed PREMIUM-01: `import.meta.env.DEV` → `(import.meta.env.DEV || import.meta.env.VITE_SHOW_TIER_TOGGLE === 'true')`

## Tests

- CategorySlider.test.tsx: 28 tests pass (5 new AI Coach tests added)
- SettingsPage.test.tsx: 11 tests pass (5 new tests: ColorSchemePicker render, palette prop, updateColorScheme call, applyPalette call, PREMIUM-01 toggle conditions)
- Full suite: 309 tests pass, 1 todo
- Build: exits 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Mock] WheelPage.test.tsx needed PaletteContext and AiCoachDrawer mocks**
- **Found during:** Task 1 (after adding `usePalette` import to WheelPage)
- **Issue:** 42 WheelPage tests failed because `usePalette()` throws when there is no PaletteProvider in the test tree; AiCoachDrawer was also not mocked
- **Fix:** Added `vi.mock('@/contexts/PaletteContext', ...)` with PALETTES stub and `vi.mock('@/components/AiCoachDrawer', ...)` to WheelPage.test.tsx
- **Files modified:** src/components/WheelPage.test.tsx
- **Commit:** e1e70d8

## Self-Check: PASSED

- src/components/CategorySlider.tsx — FOUND
- src/pages/WheelPage.tsx — FOUND
- src/pages/SettingsPage.tsx — FOUND
- Commit 2c7878b (TDD RED CategorySlider) — FOUND
- Commit 066abc2 (feat CategorySlider + WheelPage) — FOUND
- Commit 4db722b (TDD RED SettingsPage) — FOUND
- Commit e1e70d8 (feat SettingsPage + WheelPage test fix) — FOUND
