---
phase: 10
slug: pre-launch-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | SOFT-DELETE-DB | migration | `npx supabase db reset` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | SOFT-DELETE-HOOK | unit | `npm test -- --run useWheel` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | SOFT-DELETE-UI | component | `npm test -- --run WheelPage` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | SNAPSHOT-DELETE | component | `npm test -- --run SnapshotsPage` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 1 | FOOTER | component | `npm test -- --run Sidebar` | ❌ W0 | ⬜ pending |
| 10-05-01 | 05 | 1 | DUESOON-HIGHLIGHT | component | `npm test -- --run WheelChart` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useWheel.test.ts` — stubs for soft-delete/undo actions
- [ ] `src/pages/WheelPage.test.tsx` — stubs for soft-delete UI, undo, empty state recovery
- [ ] `src/pages/SnapshotsPage.test.tsx` — stubs for snapshot delete + confirmation
- [ ] `src/components/Sidebar.test.tsx` — stubs for footer links
- [ ] `src/components/WheelChart.test.tsx` — stubs for spoke highlight on hover

*If existing test files cover these, add stubs to them — do not create duplicates.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pg_cron hard-delete after 10 min | SOFT-DELETE-DB | Requires time passage | Soft-delete a wheel, wait 10 min (or manually advance clock), verify row gone from DB |
| Wheel disappears from selector after cron run | SOFT-DELETE-UI | Timing-dependent | Same as above — refresh page after cron fires |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
