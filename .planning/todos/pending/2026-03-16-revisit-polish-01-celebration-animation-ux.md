---
created: 2026-03-16T19:48:03.073Z
title: Revisit POLISH-01 celebration animation UX
area: ui
files:
  - src/components/ActionItemList.tsx
  - src/index.css
  - tailwind.config.ts
---

## Problem

The celebration animation (amber row flash on action item completion) still doesn't feel quite right after initial fixes. The timing between the flash and the modal opening was adjusted (flash at 0ms, modal at 700ms, item moves to completed at 800ms) but the UX may still feel off — the modal may appear slightly too early or the animation itself may be too subtle.

Current implementation: `animate-celebrate-row` CSS keyframe (scale 1→1.03, background transparent→#fef3c7→transparent, 800ms). Modal opens at 700ms delay.

## Solution

Options to explore:
- Extend animation duration (e.g. 1000–1200ms) and push modal delay to match
- Make animation more vivid — stronger scale (1.05+) or more saturated amber (#fcd34d instead of #fef3c7)
- Try a different visual treatment: confetti burst (canvas-confetti library), checkmark ripple, or a brief green flash
- Consider opening modal only after animation fully completes (800ms+), not during it
- User test with real data to find the sweet spot

Revisit before final polish/launch sign-off.
