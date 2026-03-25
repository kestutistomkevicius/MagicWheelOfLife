---
phase: 13
slug: trend-chart-rethink
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.1.1 |
| **Config file** | `vite.config.ts` (vitest config inline) |
| **Quick run command** | `npx vitest run src/pages/TrendPage.test.tsx src/components/TrendChart.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/pages/TrendPage.test.tsx src/components/TrendChart.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| Wave 0 | 01 | 0 | TREND-13-02 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (old deleted, new stubs added) | ⬜ pending |
| TREND-13-01 | 01 | 1 | TREND-13-01 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (new tests) | ⬜ pending |
| TREND-13-02 | 01 | 1 | TREND-13-02 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (new tests) | ⬜ pending |
| TREND-13-03 | 01 | 1 | TREND-13-03 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (new tests) | ⬜ pending |
| TREND-13-04 | 01 | 1 | TREND-13-04 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ (new tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/pages/TrendPage.test.tsx` — delete old marker tests (lines 281–504), add stub tests for interval-based improvement actions, action items list, and is_important badge
- [ ] `src/components/ActionInsightsPanel.test.tsx` — new file with stubs (only if `ActionInsightsPanel` extracted as separate component)

*Wave 0 prepares test infrastructure before implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Interval actions panel renders correctly in browser | TREND-13-01 | Visual layout check | 1. Open TrendPage with a category that improved between snapshots. 2. Verify "Actions" panel appears below chart listing completed items for that interval. |
| is_important star badge visible in UI | TREND-13-04 | Visual rendering | 1. Mark a category as important on WheelPage. 2. Navigate to TrendPage, select that category. 3. Verify star/Priority badge appears next to category name. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
