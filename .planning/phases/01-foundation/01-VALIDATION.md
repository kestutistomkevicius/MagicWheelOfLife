---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x + @testing-library/react 14.x |
| **Config file** | `vite.config.ts` (test section) — Wave 0 creates |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test of both seed users
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | AUTH-01, AUTH-02 | unit | `npm test -- --run src/pages/AuthPage.test.tsx` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | AUTH-04 | unit | `npm test -- --run src/components/ProtectedRoute.test.tsx` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | AUTH-05 | unit | `npm test -- --run src/components/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-01 | unit | `npm test -- --run src/pages/AuthPage.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-02 | unit | `npm test -- --run src/pages/AuthPage.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | AUTH-04 | unit | `npm test -- --run src/components/ProtectedRoute.test.tsx` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 1 | AUTH-05 | unit | `npm test -- --run src/components/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | DEV-01, DEV-02 | manual | `supabase db reset && manual login test` | Manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/setup.ts` — Vitest + jest-dom global setup file
- [ ] `src/pages/AuthPage.test.tsx` — stub tests for AUTH-01, AUTH-02
- [ ] `src/components/ProtectedRoute.test.tsx` — stub tests for AUTH-04 (undefined/null/session states)
- [ ] `src/components/Sidebar.test.tsx` — stub tests for AUTH-05 (sign-out button)
- [ ] `vite.config.ts` test configuration block (globals, jsdom environment, setupFiles)
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| free@test.com can sign in after db reset | DEV-01 | Requires running Supabase; auth.users not accessible via anon key | `supabase db reset` → open app → sign in as free@test.com / test123 |
| premium@test.com can sign in | DEV-02 | Same — requires live Supabase instance | `supabase db reset` → open app → sign in as premium@test.com / test123 |
| Seed data visually tells mixed-trajectory story | DEV-03, DEV-04 | Requires visual inspection of Supabase Studio | Open Studio at localhost:54323 → inspect wheels, snapshots, scores |
| Google OAuth redirect flow works end-to-end | AUTH-02 | Requires real Google Cloud credentials + browser redirect | Click "Continue with Google" → complete consent → verify session persists |
| Session survives browser refresh | AUTH-04 | Requires real browser tab refresh | Sign in → F5 → verify still authenticated (no redirect flash) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
