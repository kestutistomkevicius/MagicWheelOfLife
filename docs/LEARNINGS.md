# Project Learnings

> Updated by Claude during/after sessions.
> Format: [YYYY-MM-DD HH:mm] Category: Learning
> When 3+ entries share a topic → promote to a rule in CLAUDE.md, move entries to LEARNINGS-ARCHIVE.md

---

## Consolidated Principles
<!-- Promoted from dated entries after appearing 3+ times -->
<!-- These become the most valuable part over time -->

*(none yet — will grow here)*

---

## Recent Discoveries

### Supabase & Backend Quirks
<!-- [YYYY-MM-DD HH:mm] specific discovery about Edge Functions, RLS, Postgres, Auth, etc. -->

### Patterns That Worked
<!-- [YYYY-MM-DD HH:mm] patterns worth repeating -->

[2026-03-23] PreCompact hook + CLAUDE.md rule for automated handoff: Added `.claude/settings.json` with PreCompact(manual) hook that warns if LEARNINGS.md has no HANDOFF entry for today when `.planning/phases/` exists. CLAUDE.md updated to trigger retrospective proactively (after planning, execution, or session-end signal) without waiting to be asked.

### Mistakes & Corrections
<!-- [YYYY-MM-DD HH:mm] CORRECTED: what was wrong → what is correct -->

### Session Handoffs
<!-- [YYYY-MM-DD HH:mm] HANDOFF: where we left off, what's next -->

[2026-03-23] HANDOFF: Phase 11 (Security Fix) fully planned — 3 plans, 3 waves, verification passed. Next: `/gsd:execute-phase 11` (fresh context).
- Wave 1 (11-01): New migration `20260323000001_profiles_tier_column_security.sql` (REVOKE/GRANT column-level) + new Edge Function `supabase/functions/set-tier/index.ts`
- Wave 2 (11-02): Refactor `useProfile.updateTier` from direct `supabase.from('profiles').update({tier})` to `supabase.functions.invoke('set-tier', {body:{tier}})` + update mock in `useProfile.test.ts` (supabase.functions.invoke, not supabase.from mock)
- Wave 3 (11-03): Human verification checkpoint with live Supabase + functions serve
- Key: `SettingsPage.test.tsx` does NOT need changes — it mocks updateTier as an injected prop, not the implementation
- Key: seed.sql does NOT need changes — seeds run as postgres superuser, not `authenticated` role
- Key: run `supabase db reset` (not just `migration up`) to verify privilege changes cleanly
