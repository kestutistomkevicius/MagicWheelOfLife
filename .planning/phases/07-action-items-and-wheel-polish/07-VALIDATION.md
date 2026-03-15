---
phase: 7
slug: action-items-and-wheel-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.1.1 |
| **Config file** | vite.config.ts (vitest config embedded) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | POLISH-02 | unit | `npm test -- --run DueSoonWidget` | ❌ W0 | ⬜ pending |
| 7-02-01 | 02 | 1 | POLISH-08 | unit | `npm test -- --run ActionItemList` | ✅ | ⬜ pending |
| 7-02-02 | 02 | 1 | POLISH-01 | unit | `npm test -- --run ActionItemList` | ✅ | ⬜ pending |
| 7-02-03 | 02 | 1 | POLISH-08 | unit | `npm test -- --run ActionItemList` | ✅ | ⬜ pending |
| 7-03-01 | 03 | 1 | POLISH-07 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-03-02 | 03 | 1 | POLISH-05 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-03-03 | 03 | 1 | POLISH-06 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-04-01 | 04 | 2 | POLISH-04 | unit | `npm test -- --run CategorySlider` | ✅ | ⬜ pending |
| 7-04-02 | 04 | 2 | POLISH-04 | unit | `npm test -- --run WheelChart` | ✅ | ⬜ pending |
| 7-04-03 | 04 | 2 | POLISH-02 | unit | `npm test -- --run DueSoonWidget` | ❌ W0 | ⬜ pending |
| 7-05-01 | 05 | 2 | POLISH-03 | unit | `npm test -- --run TrendChart` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/DueSoonWidget.tsx` — component stub for POLISH-02
- [ ] `src/components/DueSoonWidget.test.tsx` — test stubs for POLISH-02 (getDueSoonItems logic, hidden-when-empty)

*All other test files already exist and need extension only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celebration animation visible on completion | POLISH-01 | CSS keyframe animations not verifiable in jsdom | Check off an action item; confirm row scales/flashes amber for ~800ms |
| Due Soon widget hover highlights WheelChart segment | POLISH-02 | Recharts canvas interaction not testable in jsdom | Hover over a due-soon item; confirm matching category axis brightens |
| Trend chart ◆ markers visible at correct dates | POLISH-03 | ReferenceLine rendering requires canvas | Open TrendPage for category with action items; verify ◆ markers appear on snapshot dates matching deadline/completion dates |
| Important category visually distinct in WheelChart | POLISH-04 | Recharts SVG fill-opacity changes require visual inspection | Mark a category as important (★); confirm polygon fill darkens/changes color in wheel |
| Upgrade prompt appears for free tier (9th category) | POLISH-06 | Free-tier simulation requires auth state manipulation | Sign in as free-tier user; try to add 9th category; confirm upgrade modal appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
