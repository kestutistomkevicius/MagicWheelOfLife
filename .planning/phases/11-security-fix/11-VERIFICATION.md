---
phase: 11-security-fix
verified: 2026-03-24T00:00:00Z
status: human_needed
score: 5/6 must-haves verified
re_verification: false
human_verification:
  - test: "Confirm free user cannot self-elevate via direct browser Supabase API call"
    expected: "supabase.from('profiles').update({ tier: 'premium' }).eq('id', userId) returns a PostgreSQL permission error — not a silent success"
    why_human: "The DB-layer REVOKE is confirmed via docker exec psql in Plan 01. However, the Plan 03 Summary explicitly states the browser DevTools path (window.__supabase / ESM CDN import) was not verifiable in that environment. The security guarantee is at the PostgreSQL layer, but the ROADMAP success criterion #1 is specifically 'via direct Supabase API call'. Full sign-off requires a live browser console test against a running local Supabase instance."
---

# Phase 11: Security Fix Verification Report

**Phase Goal:** Close DEC-006 — free users must not be able to self-elevate to premium tier via direct API call
**Verified:** 2026-03-24
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria + Plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A free user cannot patch their own `tier` column to `premium` via direct Supabase API call | ? UNCERTAIN | Migration `REVOKE UPDATE ON TABLE public.profiles FROM authenticated` exists and was applied (confirmed via docker exec psql in Plan 01 SUMMARY). Browser-path test was not completed in Plan 03 — see Human Verification section. |
| 2 | Tier assignment path exists exclusively via service-role (Edge Function or subscriptions table) | ✓ VERIFIED | `set-tier/index.ts` uses `SUPABASE_SERVICE_ROLE_KEY` for the write; `useProfile.updateTier` calls `functions.invoke('set-tier')` not direct `.update({ tier })`; no other path found in `src/` |
| 3 | Existing tier-gated features continue working correctly after the RLS change | ✓ VERIFIED | Human verified in Plan 03: dev tier toggle persists across refresh, avatar upload unaffected. 329 automated tests green. |
| 4 | An unauthenticated caller receives 401 from the set-tier Edge Function | ✓ VERIFIED | Automated smoke test in Plan 03 confirmed: `curl` without Authorization header returns 401. Edge Function checks `authHeader` null and returns `401` before any DB access. |
| 5 | SELECT on profiles still returns all columns including tier | ✓ VERIFIED | `GRANT SELECT ON TABLE public.profiles TO authenticated` present in migration file. `useProfile.ts` successfully fetches `tier, avatar_url, color_scheme` via `.select('id, tier, avatar_url, color_scheme')`. |
| 6 | useProfile.updateTier does NOT call supabase.from('profiles').update({ tier }) directly | ✓ VERIFIED | `src/hooks/useProfile.ts` line 85: `supabase.functions.invoke('set-tier', { body: { tier: newTier } })`. Grep for `.update({.*tier` in `src/` returns zero matches. |

**Score:** 5/6 truths verified (1 uncertain — requires human browser test)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260323000001_profiles_tier_column_security.sql` | Column-level REVOKE/GRANT | ✓ VERIFIED | File exists, 11 lines, contains all three required SQL statements |
| `supabase/functions/set-tier/index.ts` | JWT-validated Edge Function for tier writes | ✓ VERIFIED | File exists, 59 lines, full implementation with CORS, JWT validation, input validation, service-role write |
| `src/hooks/useProfile.ts` | `updateTier` routes through set-tier Edge Function | ✓ VERIFIED | Line 85: `functions.invoke('set-tier', { body: { tier: newTier } })`. Old direct write pattern absent. |
| `src/hooks/useProfile.test.ts` | `mockInvoke` used for updateTier test | ✓ VERIFIED | Line 14: `mockInvoke` in `vi.hoisted` block. Line 26: `functions: { invoke: mockInvoke }` in mock factory. Two updateTier tests at lines 131 and 148. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `20260323000001_profiles_tier_column_security.sql` | `public.profiles authenticated role` | `REVOKE UPDATE ON TABLE public.profiles FROM authenticated` | ✓ WIRED | Line 4 of migration file: exact pattern present |
| `supabase/functions/set-tier/index.ts` | `public.profiles tier column` | `SUPABASE_SERVICE_ROLE_KEY` (service-role client) | ✓ WIRED | Line 45: `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!`. Service-role key NOT present in any `src/` file (confirmed by grep). |
| `src/hooks/useProfile.ts updateTier` | `supabase/functions/set-tier/index.ts` | `supabase.functions.invoke('set-tier')` | ✓ WIRED | Line 85: `supabase.functions.invoke('set-tier', { body: { tier: newTier } })` |

---

### Requirements Coverage

| Requirement ID | Source Plan(s) | Description | Status | Evidence |
|----------------|---------------|-------------|--------|----------|
| SEC-01 | 11-01, 11-02, 11-03 | Authenticated role cannot UPDATE the tier column on profiles directly | ✓ SATISFIED | Migration revokes table-level UPDATE; column-level GRANT permits only `avatar_url` and `color_scheme`; direct `.update({ tier })` removed from `useProfile.ts` |
| SEC-02 | 11-01, 11-03 | Unauthenticated caller receives 401 from the set-tier Edge Function | ✓ SATISFIED | Edge Function line 14-16: `Authorization` header absence returns 401; automated curl smoke test confirmed |
| SEC-03 | 11-01, 11-02, 11-03 | Existing tier-gated features work after the security change | ✓ SATISFIED | Dev tier toggle human-verified in Plan 03 (persists across refresh); avatar upload verified; 329 tests green |

**ORPHANED requirements note:** SEC-01, SEC-02, SEC-03 are defined in ROADMAP.md (Phase 11 section) and plan frontmatter `requirements:` fields but do NOT appear in `.planning/REQUIREMENTS.md`. The REQUIREMENTS.md traceability table stops at Phase 7 and contains no SEC-* entries. These requirement IDs exist only in planning documents for this phase. This is an administrative gap — the requirements are clearly documented in ROADMAP.md — but the REQUIREMENTS.md file is out of sync.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO, FIXME, placeholder, or empty-implementation patterns detected in phase artifacts.

---

### Human Verification Required

#### 1. SEC-01: Browser DevTools direct PATCH blocked

**Test:** Sign in as the free user (free@example.com) at http://localhost:5173. Open browser DevTools console. Run:
```javascript
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
const sb = createClient('http://localhost:54321', '<anon-key>')
const { data } = await sb.auth.signInWithPassword({ email: 'free@example.com', password: 'password123' })
const result = await sb.from('profiles').update({ tier: 'premium' }).eq('id', data.user.id)
console.log(result.error)
```
**Expected:** `result.error` is not null. Should show a PostgreSQL permission error or PostgREST 403.

**Why human:** Plan 03 SUMMARY explicitly states this test could not be run in that environment (`window.__supabase` not exposed, ESM CDN import not practical). The DB-level REVOKE is confirmed via `docker exec psql` but the specific browser API path required by ROADMAP success criterion #1 was not verified against the live stack.

---

### Gaps Summary

No code gaps found. All artifacts exist, are substantive, and are correctly wired. The single uncertain item is an end-to-end browser verification of SEC-01 that was deferred during Plan 03 due to environment constraints. The underlying security guarantee (DB-layer REVOKE) is confirmed at the PostgreSQL layer. The browser test is needed to formally close the ROADMAP success criterion as written.

---

## Commit Verification

All three implementation commits are present on the `develop` branch:

| Commit | Description | Verified |
|--------|-------------|---------|
| `fe90440` | feat(11-01): restrict tier column to service-role only | ✓ Present |
| `b22991d` | feat(11-01): add set-tier Edge Function with JWT validation and service-role write | ✓ Present |
| `f1e46ba` | refactor(11-02): route updateTier through set-tier Edge Function | ✓ Present |

---

_Verified: 2026-03-24_
_Verifier: Claude (gsd-verifier)_
