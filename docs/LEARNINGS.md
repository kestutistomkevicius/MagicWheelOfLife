# Project Learnings

> Updated by Claude during/after sessions.
> Format: [YYYY-MM-DD HH:mm] Category: Learning
> When 3+ entries share a topic → promote to a rule in CLAUDE.md, move entries to LEARNINGS-ARCHIVE.md
>
> **Scope:** Non-obvious discoveries, corrections, and patterns only.
> "Where we are / what's next" → STATE.md `stopped_at`. Architectural decisions → STATE.md Decisions.

---

## Consolidated Principles
<!-- Promoted from dated entries after appearing 3+ times -->
<!-- These become the most valuable part over time -->

*(none yet — will grow here)*

---

## Recent Discoveries

### Supabase & Backend Quirks
<!-- [YYYY-MM-DD HH:mm] specific discovery about Edge Functions, RLS, Postgres, Auth, etc. -->

[2026-03-24 14:43] `npx supabase status` no longer labels the anon JWT as "anon key" — it now shows "Publishable" and "Secret". The actual JWT anon key lives in `.env.local` as `VITE_SUPABASE_ANON_KEY`.

### Patterns That Worked
<!-- [YYYY-MM-DD HH:mm] patterns worth repeating -->

[2026-03-24 15:37] Phase 12 planning: Research revealed the "broken" multi-wheel experience was a test coverage gap, not missing production code. Both success criteria (TrendPage wheel selector + Sidebar plural label) were already implemented in source. Planner correctly scoped the phase to writing missing tests + one targeted UX fix (clearing stale state on wheel switch), not a refactor.

[2026-03-23 23:44] PreCompact hook + CLAUDE.md rule for automated handoff: Added `.claude/settings.json` with PreCompact(manual) hook that warns if LEARNINGS.md has no HANDOFF entry for today when `.planning/phases/` exists. CLAUDE.md updated to trigger retrospective proactively (after planning, execution, or session-end signal) without waiting to be asked.

### Mistakes & Corrections
<!-- [YYYY-MM-DD HH:mm] CORRECTED: what was wrong → what is correct -->

[2026-03-23 23:44] CORRECTED: LEARNINGS.md datetime format must be `[YYYY-MM-DD HH:mm]` using the user's **local time** (run `powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"` to get it) — not UTC, not date-only, not a guessed time.
