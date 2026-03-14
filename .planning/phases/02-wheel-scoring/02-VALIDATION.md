---
phase: 2
slug: wheel-scoring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react 16.x (installed in Phase 1) |
| **Config file** | `vite.config.ts` (test section — already configured) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test of both seed users
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0 | Wave 0 | 0 | WHEEL-01, WHEEL-02 | unit stub | `npm test -- --run src/hooks/useWheel.test.ts` | ❌ W0 | ⬜ pending |
| 2-W0 | Wave 0 | 0 | WHEEL-03 | unit stub | `npm test -- --run src/hooks/useCategories.test.ts` | ❌ W0 | ⬜ pending |
| 2-W0 | Wave 0 | 0 | SCORE-01, SCORE-02, SCORE-03 | unit stub | `npm test -- --run src/components/CategorySlider.test.tsx` | ❌ W0 | ⬜ pending |
| 2-W0 | Wave 0 | 0 | WHEEL-04, WHEEL-05, WHEEL-06, WHEEL-07 | unit stub | `npm test -- --run src/components/WheelPage.test.tsx` | ❌ W0 | ⬜ pending |
| 2-01 | DB schema | 1 | WHEEL-01..07, SCORE-01..03 | unit | `npm test -- --run` | ✅ Wave 0 | ⬜ pending |
| 2-02 | useWheel hook | 1 | WHEEL-01, WHEEL-02, WHEEL-06, WHEEL-07 | unit | `npm test -- --run src/hooks/useWheel.test.ts` | ✅ Wave 0 | ⬜ pending |
| 2-03 | useCategories hook | 1 | WHEEL-03, WHEEL-04, WHEEL-05 | unit | `npm test -- --run src/hooks/useCategories.test.ts` | ✅ Wave 0 | ⬜ pending |
| 2-04 | WheelChart component | 2 | SCORE-01, SCORE-02, SCORE-03 | unit | `npm test -- --run src/components/WheelChart.test.tsx` | ✅ Wave 0 | ⬜ pending |
| 2-05 | CategorySlider component | 2 | SCORE-01, SCORE-02, SCORE-03 | unit | `npm test -- --run src/components/CategorySlider.test.tsx` | ✅ Wave 0 | ⬜ pending |
| 2-06 | WheelPage integration | 3 | All WHEEL + SCORE | integration | `npm test -- --run src/components/WheelPage.test.tsx` | ✅ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useWheel.test.ts` — stubs for WHEEL-01, WHEEL-02, WHEEL-06, WHEEL-07
- [ ] `src/hooks/useCategories.test.ts` — stubs for WHEEL-03, WHEEL-04, WHEEL-05
- [ ] `src/components/CategorySlider.test.tsx` — stubs for SCORE-01, SCORE-02, SCORE-03
- [ ] `src/components/WheelPage.test.tsx` — stubs for WHEEL-04, WHEEL-05, WHEEL-06, WHEEL-07, SCORE-03 integration
- [ ] `src/components/WheelChart.test.tsx` — smoke: chart renders with data, renders empty state

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Free-tier user blocked from second wheel at DB level | WHEEL-06 | RLS policy enforcement requires actual DB; no mock can verify SECURITY DEFINER function | Run `supabase db reset`, sign in as free@test.com, attempt to create a second wheel via REST or Studio |
| Premium-tier user can create second wheel | WHEEL-07 | Same as above | Sign in as premium@test.com, create second wheel via REST or Studio |
| Radar chart redraws visually on slider drag | SCORE-01, SCORE-02 | Visual/animation behavior not reliably testable in jsdom | Open app, drag slider, confirm chart updates in real time |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
