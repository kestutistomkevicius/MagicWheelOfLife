---
phase: 3
slug: action-items
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react 16.x (installed in Phase 1) |
| **Config file** | `vite.config.ts` (test section — already configured) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | ACTION-01..04 | unit stub | `npm test -- --run src/hooks/useActionItems.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | ACTION-01..04 | unit stub | `npm test -- --run src/components/ActionItemList.test.tsx` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | — | migration | `supabase db reset` | manual | ⬜ pending |
| 3-03-01 | 03 | 3 | ACTION-01, ACTION-02, ACTION-04 | unit | `npm test -- --run src/hooks/useActionItems.test.ts` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 4 | ACTION-01..04 | unit | `npm test -- --run src/components/ActionItemList.test.tsx` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 5 | ACTION-01..04 | unit | `npm test -- --run src/components/WheelPage.test.tsx` | ✅ update | ⬜ pending |
| 3-06-01 | 06 | 6 | all | manual | human verification | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useActionItems.test.ts` — stubs for ACTION-01 hook logic, ACTION-02 deadline null conversion, ACTION-04 delete call
- [ ] `src/components/ActionItemList.test.tsx` — stubs for ACTION-01 add button disabled at 7, ACTION-02 date display, ACTION-03 checkbox toggle + line-through, ACTION-04 optimistic removal
- [ ] `npx shadcn@latest add checkbox` — shadcn Checkbox component (Wave 0 prerequisite, not a test file)

*(WheelPage.test.tsx already exists — update required in integration plan to add expand/collapse and ActionItemList integration tests)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| action_items row only visible to owner | ACTION-01..04 | RLS bypass not testable in unit tests | `supabase db reset && Studio RLS check or REST API call as different user` |
| Full UX flow: add/check/delete action items | all | End-to-end visual verification | Log in as free-tier user, expand Health category, add item, set deadline, check complete, delete |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
