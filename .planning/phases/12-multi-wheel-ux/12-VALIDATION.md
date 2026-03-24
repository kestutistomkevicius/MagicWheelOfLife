---
phase: 12
slug: multi-wheel-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react |
| **Config file** | `vite.config.ts` (test block) |
| **Quick run command** | `npx vitest run src/components/Sidebar.test.tsx src/pages/TrendPage.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/Sidebar.test.tsx src/pages/TrendPage.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 0 | MW-02 | unit | `npx vitest run src/components/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 0 | MW-01 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | MW-01 | unit | `npx vitest run src/pages/TrendPage.test.tsx` | ✅ | ⬜ pending |
| 12-01-04 | 01 | 1 | MW-02 | unit | `npx vitest run src/components/Sidebar.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test case in `src/components/Sidebar.test.tsx` — covers MW-02 (plural label when `wheels.length > 1`)
- [ ] New test case in `src/pages/TrendPage.test.tsx` — covers MW-01 (snapshot reload after wheel switch)

*(Both test FILES already exist; only new test cases within them are needed.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TrendPage shows 2 wheels in selector for premium user | MW-01 | Requires real Supabase session with seeded premium user | Run `npx supabase start`, log in as `premium@test.com`, navigate to TrendPage, verify wheel selector dropdown shows both "My Wheel" and "Work & Purpose" |
| Switching wheels loads correct snapshot data | MW-01 | Requires real Supabase data; mock tests verify API call, not rendered output | After step above, switch to "Work & Purpose" wheel, verify chart reflects that wheel's 3 snapshots |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
