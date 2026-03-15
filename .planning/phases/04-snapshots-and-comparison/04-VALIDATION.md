---
phase: 4
slug: snapshots-and-comparison
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | SNAP-01 | unit stub | `npm test` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | SNAP-01 | migration | `supabase db reset` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | SNAP-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | SNAP-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 4 | COMP-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 5 | COMP-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-06-01 | 06 | 6 | all | manual | browser | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useSnapshots.test.ts` — stubs for SNAP-01, SNAP-02
- [ ] `src/components/SnapshotsPage.test.tsx` — stubs for SNAP-02, COMP-01, COMP-02
- [ ] `src/components/ComparisonChart.test.tsx` — stubs for COMP-01
- [ ] `supabase/migrations/20260315000002_snapshots.sql` — snapshots + snapshot_scores tables

*Existing infrastructure (Vitest + RTL + Supabase mock pattern) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overlay chart renders two wheels in distinct colors | COMP-01 | Visual/pixel verification | Select 2 snapshots, confirm both datasets visible with different colors |
| Category trend table shows correct historical scores | COMP-02 | Data integrity visual check | Select a category, verify scores match known seed data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
