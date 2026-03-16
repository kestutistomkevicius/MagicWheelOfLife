---
phase: 5
slug: trend-chart
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1.x + @testing-library/react 16.x |
| **Config file** | `vite.config.ts` (test section — already configured) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | TREND-01 | unit stub | `npm test -- --run src/components/TrendChart.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 0 | TREND-01 | unit stub | `npm test -- --run src/pages/TrendPage.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | TREND-01 | unit | `npm test -- --run src/components/TrendChart.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 1 | TREND-01 | unit | `npm test -- --run src/pages/TrendPage.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-05 | 01 | 1 | TREND-01 | unit | `npm test -- --run src/pages/TrendPage.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/TrendChart.test.tsx` — stubs for TREND-01 (two-Line render, color props)
- [ ] `src/pages/TrendPage.test.tsx` — stubs for TREND-01 (empty state, chart render, category select, data transforms)

*No framework install needed — Vitest + @testing-library/react already installed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| End-to-end: log in as premium@test.com, navigate to /trend, verify chart renders with 4 data points, change category | TREND-01 | Requires live Supabase + seeded data; browser rendering of SVG chart | `supabase start && npm run dev` → log in as premium@test.com → /trend → verify chart shows 4 points → change category → verify chart updates |
| Log in as free@test.com (no snapshots), verify empty state shows "0 so far" | TREND-01 | Requires live auth + Supabase | `supabase start && npm run dev` → log in as free@test.com → /trend → verify empty state message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
