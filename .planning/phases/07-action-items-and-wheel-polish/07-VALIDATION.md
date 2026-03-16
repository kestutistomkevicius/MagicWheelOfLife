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
| 7-01-T1 | 01 | 0 | POLISH-04, POLISH-08 | migration | `npx supabase db reset --local` | ❌ W0 creates | ⬜ pending |
| 7-01-T2 | 01 | 0 | POLISH-02, POLISH-04 | unit | `npm test -- --run` | ❌ W0 creates | ⬜ pending |
| 7-02-T1 | 02 | 1 | POLISH-01, POLISH-08 | unit | `npm test -- --run useActionItems` | ✅ | ⬜ pending |
| 7-03-T1 | 03 | 1 | POLISH-04, POLISH-07 | unit | `npm test -- --run useWheel` | ✅ | ⬜ pending |
| 7-03-T2 | 03 | 1 | POLISH-04 | unit | `npm test -- --run useWheel` | ✅ | ⬜ pending |
| 7-04-T1 | 04 | 2 | POLISH-01, POLISH-08 | unit | `npm test -- --run ActionItemList` | ✅ | ⬜ pending |
| 7-04-T2 | 04 | 2 | POLISH-08 | unit | `npm test -- --run ActionItemList` | ✅ | ⬜ pending |
| 7-05-T1 | 05 | 2 | POLISH-05, POLISH-06, POLISH-07 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-05-T2 | 05 | 2 | POLISH-02, POLISH-04 | unit | `npm test -- --run DueSoonWidget` | ❌ W0 creates | ⬜ pending |
| 7-05-T3 | 05 | 2 | POLISH-04 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-06-T1 | 06 | 2 | POLISH-04 | unit | `npm test -- --run CategorySlider` | ✅ | ⬜ pending |
| 7-06-T2 | 06 | 2 | POLISH-04 | unit | `npm test -- --run WheelPage` | ✅ | ⬜ pending |
| 7-06-T3 | 06 | 2 | POLISH-04 | unit | `npm test -- --run WheelChart` | ✅ | ⬜ pending |
| 7-07-T1 | 07 | 3 | POLISH-03 | unit | `npm test -- --run TrendChart` | ✅ | ⬜ pending |
| 7-07-T2 | 07 | 3 | POLISH-03 | unit | `npm test -- --run TrendPage` | ✅ | ⬜ pending |
| 7-08-T1 | 08 | 4 | ALL | build | `npm test -- --run && npm run build` | ✅ | ⬜ pending |
| 7-08-T2 | 08 | 4 | ALL | human | human verification in browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/DueSoonWidget.tsx` — component stub for POLISH-02
- [ ] `src/components/DueSoonWidget.test.tsx` — test stubs for POLISH-02 (getDueSoonItems logic, hidden-when-empty)
- [ ] `src/components/WheelChart.tsx` — stub optional props `highlightedCategory?` and `importantCategories?` added to interface (no rendering yet)

*All other test files already exist and need extension only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celebration animation visible on completion | POLISH-01 | CSS keyframe animations not verifiable in jsdom | Check off an action item; confirm row scales/flashes amber for ~800ms |
| Due Soon widget hover highlights WheelChart segment | POLISH-02 | Recharts canvas interaction not testable in jsdom | Hover over a due-soon item; confirm matching category axis brightens |
| Trend chart ◆ markers visible at correct dates | POLISH-03 | ReferenceLine rendering requires canvas | Open TrendPage for category with action items; verify ◆ markers appear on snapshot dates matching deadline/completion dates |
| Important category visually distinct in WheelChart | POLISH-04 | Recharts SVG fill-opacity changes require visual inspection | Mark a category as important (★); confirm polygon fill darkens/changes color in wheel |
| Auto-prompt nudge dialog appears after big gap | POLISH-04 | Requires live slider interaction | As premium user, commit a score where |tobe - asis| >= 3 for non-important category; confirm nudge dialog appears |
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
