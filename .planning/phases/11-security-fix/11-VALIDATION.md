---
phase: 11
slug: security-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vite.config.ts` (vitest config co-located) |
| **Quick run command** | `npx vitest run src/hooks/useProfile.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/useProfile.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SEC-01 | unit | `npx vitest run src/hooks/useProfile.test.ts` | ✅ (needs update) | ⬜ pending |
| 11-01-02 | 01 | 1 | SEC-01 | unit | `npx vitest run src/hooks/useProfile.test.ts` | ✅ (needs update) | ⬜ pending |
| 11-01-03 | 01 | 1 | SEC-02 | manual smoke | `supabase functions serve` + `curl` without auth → expect 401 | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | SEC-03 | unit | `npx vitest run src/hooks/useProfile.test.ts` | ✅ | ⬜ pending |
| 11-01-05 | 01 | 1 | SEC-03 | unit | `npx vitest run src/pages/SettingsPage.test.tsx` | ✅ (needs update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing test infrastructure covers all phase requirements after in-place updates.
- No new test files needed — `useProfile.test.ts` and `SettingsPage.test.tsx` are updated in-place in Wave 1.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `set-tier` Edge Function rejects unauthenticated requests | SEC-02 | Edge Function JWT validation cannot be meaningfully unit tested without a live Supabase Functions runtime | Run `supabase functions serve`, then `curl -X POST http://localhost:54321/functions/v1/set-tier -d '{"tier":"premium"}'` without Authorization header — expect 401 |
| Free user cannot PATCH `tier` via direct Supabase API | SEC-01 | Requires live DB with column-level privilege applied | After `supabase db reset`, open browser dev console, call `supabase.from('profiles').update({ tier: 'premium' }).eq('id', userId)` — expect PostgreSQL error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
