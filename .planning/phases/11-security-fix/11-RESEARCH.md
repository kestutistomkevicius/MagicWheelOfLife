# Phase 11: Security Fix - Research

**Researched:** 2026-03-23
**Domain:** Supabase RLS, PostgreSQL column-level privileges, tier enforcement
**Confidence:** HIGH

## Summary

DEC-006 was logged in Phase 2 and explicitly deferred until before monetization. The current `profiles: update own` RLS policy allows an authenticated user to call `supabase.from('profiles').update({ tier: 'premium' })` from the browser and self-upgrade for free. This must be closed before any real payment integration.

The fix has two independent layers. The first — and mandatory — layer is to remove write access to the `tier` column from the `authenticated` role. The correct PostgreSQL tool is column-level `REVOKE`/`GRANT` privilege, not RLS (RLS operates at the row level, not the column level). The second layer is providing a safe server-side-only path for legitimate tier assignment, needed for the dev tier toggle on SettingsPage and for future Stripe webhook integration.

The dev-only tier toggle in `SettingsPage.tsx` currently relies on `updateTier` in `useProfile`, which calls the direct `profiles.update({ tier })` Supabase client call. After closing the RLS gap, this direct call will fail at the DB level. A replacement mechanism — a Supabase Edge Function callable with the anon/user JWT but executing with service-role — must be provided so the dev toggle continues to work without exposing the same vulnerability.

**Primary recommendation:** Narrow `GRANT UPDATE` on `public.profiles` to exclude `tier` for the `authenticated` role; create a `set-tier` Edge Function (service-role) for all legitimate tier changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 (implicit) | Free user cannot PATCH `tier` to `premium` via direct API | Column-level GRANT revoke blocks this at DB level — no RLS rewrite needed |
| SEC-02 (implicit) | Tier assignment path is service-role only | `set-tier` Edge Function with `SUPABASE_SERVICE_ROLE_KEY` provides the only write path |
| SEC-03 (implicit) | Existing tier-gated features continue working | Only the UPDATE privilege on `tier` changes; SELECT and UPDATE of other profile columns are unaffected |
</phase_requirements>

---

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|---|---|---|---|
| Supabase CLI migrations | current project version | Column privilege changes via `REVOKE`/`GRANT` in a new migration file | Already the project's migration tool — all schema changes go through `supabase/migrations/` |
| Supabase Edge Functions (Deno) | current project version | `set-tier` function executes with service-role key | Already used in Phase 9 for AI coach; same pattern |
| Vitest + @testing-library | 3.x / 6.x | Unit tests for updated `useProfile` hook | Existing test infrastructure |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (env secret) | n/a | Allows Edge Function to bypass RLS entirely | Required for any server-side tier mutation |
| `supabase.functions.invoke()` | Supabase JS client | Frontend calls `set-tier` Edge Function instead of direct DB update | Used in `useProfile.updateTier` replacement |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|---|---|---|
| Column-level GRANT revoke | Separate `tier_assignments` table (row-level split) | Table split is the Supabase-recommended approach for advanced cases, but it is significantly more invasive — it requires schema changes, FK references, and updates to every RLS policy that reads `tier`. Column-level GRANT revoke achieves the same protection with a single migration line. |
| Column-level GRANT revoke | `WITH CHECK (tier = OLD.tier)` in RLS policy | PostgreSQL RLS `WITH CHECK` does not have access to `OLD` row values in UPDATE policies — this approach does not work. |
| Edge Function for dev toggle | Allow `tier` writes only in DEV env | Env-conditional DB permissions are not a sound pattern; the security boundary must be uniform across environments. The dev toggle simply calls the Edge Function instead of the direct DB method. |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/
├── migrations/
│   └── 20260323000001_profiles_tier_column_security.sql   # new
└── functions/
    └── set-tier/
        └── index.ts                                        # new Edge Function
src/
└── hooks/
    └── useProfile.ts                                       # updateTier changed: direct DB → functions.invoke
```

### Pattern 1: Column-Level Privilege Restriction

**What:** `REVOKE UPDATE` on the `tier` column from the `authenticated` role, then `GRANT UPDATE` on the remaining profile columns explicitly.

**When to use:** When a table has a mix of user-editable and server-only columns. This is exactly the `profiles` situation: `avatar_url` and `color_scheme` must remain user-editable; `tier` must not.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/column-level-security
-- Revoke full-table UPDATE from authenticated (which currently allows all columns)
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

-- Grant UPDATE only on the safe columns
GRANT UPDATE (avatar_url, color_scheme) ON TABLE public.profiles TO authenticated;
```

**Critical note:** After this change, `SELECT *` on `profiles` by the `authenticated` role will still work — column-level restrictions only affect write operations when column privileges are granted at the column level. However, any attempt to `UPDATE` the `tier` column from the browser Supabase client will receive a PostgreSQL error (`ERROR: permission denied for column tier`).

**Also required:** The existing `profiles: update own` RLS policy remains in place (it still controls *which rows* are editable). The column-level grant controls *which columns* are editable within those rows. Both layers are needed.

### Pattern 2: Service-Role Edge Function for Tier Assignment

**What:** A Deno Edge Function (`set-tier`) that accepts `{ userId, tier }` in the request body and uses the service-role Supabase client to write to `profiles.tier`. It validates the calling user's JWT before acting.

**When to use:** Any server-side operation that must bypass RLS (service-role) while still being triggered by an authenticated user action.

**Example:**
```typescript
// Source: Phase 9 ai-coach Edge Function pattern (same project)
// supabase/functions/set-tier/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Validate the caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const { tier } = await req.json() as { tier: 'free' | 'premium' }
  if (tier !== 'free' && tier !== 'premium') {
    return new Response('Invalid tier', { status: 400 })
  }

  // Use service-role client to bypass RLS for the tier write
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { error } = await serviceClient
    .from('profiles')
    .update({ tier })
    .eq('id', user.id)

  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Note on DEV-only guard:** The Edge Function should be unconditionally available (no env-based tier guard). The SettingsPage dev toggle is already guarded by `import.meta.env.DEV || VITE_SHOW_TIER_TOGGLE` at the UI level. The Edge Function itself does not need to replicate that guard — it is a valid server-side operation path in all environments.

### Pattern 3: useProfile.updateTier Replacement

**What:** Replace the direct `supabase.from('profiles').update({ tier })` call with `supabase.functions.invoke('set-tier', { body: { tier } })`.

**Example:**
```typescript
// Before (insecure — direct DB write)
async function updateTier(newTier: 'free' | 'premium'): Promise<void> {
  await supabase.from('profiles').update({ tier: newTier }).eq('id', userId)
  setTier(newTier)
}

// After (secure — via service-role Edge Function)
async function updateTier(newTier: 'free' | 'premium'): Promise<void> {
  const { error } = await supabase.functions.invoke('set-tier', {
    body: { tier: newTier },
  })
  if (error) throw error
  setTier(newTier)
}
```

### Anti-Patterns to Avoid

- **`WITH CHECK (tier = 'free')` in the existing RLS UPDATE policy:** RLS `WITH CHECK` cannot reference the pre-update row value. This does not prevent a user from setting tier = 'premium'; it would only prevent changes *away* from 'free' if you hardcode 'free', which would break all updates entirely. Column-level GRANT is the correct tool.
- **Env-conditional DB permissions:** Do not write SQL like `IF current_setting('app.environment') = 'development' THEN GRANT ...`. Environment logic belongs in application code, not schema.
- **Removing the `profiles: update own` RLS policy entirely:** This would break `avatar_url` and `color_scheme` updates. The RLS policy stays; only the column-level grant changes.
- **Using the service-role key in browser code:** The `SUPABASE_SERVICE_ROLE_KEY` must never be embedded in the frontend. It lives only in Supabase secrets (Edge Function environment). The Edge Function is the only authorized caller of service-role operations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Blocking a single column from writes | Custom middleware or frontend validation | PostgreSQL `REVOKE UPDATE (col)` / `GRANT UPDATE (col1, col2)` | Enforced at DB engine level — impossible to bypass from the browser regardless of client code |
| Server-side tier mutation | A separate HTTP server or .NET API | Supabase Edge Function with service-role key | Already in the project stack (Phase 9 pattern), deployed and managed by Supabase |

**Key insight:** Security boundaries must be enforced at the database layer. Any client-side or frontend-only enforcement can be bypassed by any user with browser dev tools.

---

## Common Pitfalls

### Pitfall 1: Column-Level Grant Breaks `SELECT *` with `authenticated` Role

**What goes wrong:** After `REVOKE UPDATE ON TABLE profiles FROM authenticated` + `GRANT UPDATE (avatar_url, color_scheme)`, calling `supabase.from('profiles').select('*')` may fail with a permission error on the `tier` column in some PostgreSQL configurations.

**Why it happens:** Column-level UPDATE privilege does not inherently affect SELECT. However, Supabase's PostgREST layer may reject wildcard selects on tables where column-level grant is active for the `authenticated` role depending on version.

**How to avoid:** Also explicitly `GRANT SELECT ON TABLE public.profiles TO authenticated` after the revoke to ensure read access remains intact. Or test `select('*')` immediately after applying the migration locally.

**Warning signs:** `useProfile` fetch returns an error or empty data after the migration.

### Pitfall 2: Migration Changes Column Privileges But Local DB Is Not Reset

**What goes wrong:** Developers run `supabase db reset` and the new migration applies, but they test against a running local DB that only had `supabase migration up` applied — the older GRANT state may persist if the migration was applied to an already-running instance without reset.

**How to avoid:** Always test the security fix with `supabase db reset` (full wipe + replay) to ensure the migration sequence is correct, not just incremental `migration up`.

### Pitfall 3: Edge Function Not Deployed Locally Before Tests

**What goes wrong:** After `updateTier` is changed to call `supabase.functions.invoke('set-tier')`, the dev tier toggle fails locally because the Edge Function is not running.

**How to avoid:** Run `supabase functions serve` alongside `supabase start` when testing the dev tier toggle locally. Document this in `dev-setup.md`.

### Pitfall 4: Seed Still Uses Direct `profiles` Tier Insert

**What goes wrong:** `seed.sql` may directly set `tier = 'premium'` for the premium test user. After the column privilege revoke, this seed insert may fail if it goes through the `authenticated` role.

**How to avoid:** Seed runs as the service role (Supabase CLI `db reset` uses the postgres superuser role), so column-level privileges on the `authenticated` role do not affect seed execution. No seed change is required.

### Pitfall 5: `useProfile.test.ts` `updateTier` Test Expects Direct DB Call

**What goes wrong:** The existing test at line 127 of `useProfile.test.ts` mocks `supabase.from('profiles').update()`. After the refactor to `functions.invoke`, the mock strategy must change.

**How to avoid:** Update the `updateTier` test to mock `supabase.functions.invoke` instead of `supabase.from(...).update`. The test assertion (`result.current.tier === 'premium'`) stays the same.

---

## Code Examples

### Migration: Restrict tier Column

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/column-level-security
-- supabase/migrations/20260323000001_profiles_tier_column_security.sql

-- Revoke table-level UPDATE grant from authenticated role.
-- This removes the implicit "all columns" update permission.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

-- Re-grant UPDATE only on columns users are allowed to change.
GRANT UPDATE (avatar_url, color_scheme) ON TABLE public.profiles TO authenticated;

-- Ensure SELECT remains intact for all profile columns.
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Note: The "profiles: update own" RLS policy remains unchanged.
-- It continues to enforce row-level ownership (user_id = auth.uid()).
-- Column-level privilege enforces which columns within that row can be changed.
```

### Verifying the Fix (psql)

```sql
-- Run as an authenticated user (not postgres/service_role) to confirm
-- that updating tier directly is now blocked:
SET ROLE authenticated;
SET request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
UPDATE public.profiles SET tier = 'premium' WHERE id = '00000000-0000-0000-0000-000000000001';
-- Expected: ERROR: permission denied for column tier
```

### Mocking functions.invoke in Vitest

```typescript
// Source: Vitest + Supabase testing pattern
// In useProfile.test.ts — updated mock for updateTier
const mockInvoke = vi.fn().mockResolvedValue({ data: { ok: true }, error: null })
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  },
}))

it('updateTier calls set-tier Edge Function', async () => {
  // ... setup ...
  await act(async () => {
    await result.current.updateTier('premium')
  })
  expect(mockInvoke).toHaveBeenCalledWith('set-tier', { body: { tier: 'premium' } })
  expect(result.current.tier).toBe('premium')
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `profiles: update own` allows all columns | Column-level GRANT blocks `tier` write for `authenticated` | Phase 11 | Free users cannot self-upgrade; all other profile updates unchanged |
| `updateTier` calls `supabase.from('profiles').update({ tier })` directly | `updateTier` calls `supabase.functions.invoke('set-tier')` | Phase 11 | Tier changes route through service-role Edge Function only |

**Still valid after this phase:**
- The `profiles: update own` RLS policy stays — it still owns the row-level ownership check
- The dev tier toggle in SettingsPage UI stays — it just calls the Edge Function instead of direct DB

---

## Open Questions

1. **Should the `set-tier` Edge Function include an admin/service-role guard for future Stripe webhook use?**
   - What we know: The Phase 11 goal is only to close the self-elevation vector. Future monetization (Phase: Stripe webhook) will need a verified-payment path to call tier assignment.
   - What's unclear: Whether the same Edge Function should be reused for webhook-triggered upgrades or a separate function (`handle-stripe-webhook`) will own that path.
   - Recommendation: Keep `set-tier` simple — authenticate-then-set. Future webhook function will call the same `service-role` DB update directly or call `set-tier` internally. No premature abstraction needed in Phase 11.

2. **Does the `GRANT SELECT` line need to be explicit, or is it already granted via Supabase's default `anon`/`authenticated` grants?**
   - What we know: Supabase grants `SELECT` on all public schema tables to `authenticated` by default at project creation. `REVOKE UPDATE` does not affect `SELECT`.
   - What's unclear: Whether the existing Supabase project has been modified from defaults.
   - Recommendation: Include `GRANT SELECT ON TABLE public.profiles TO authenticated` in the migration as a defensive no-op. It is idempotent and clarifies intent.

---

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Vitest 3.x |
| Config file | `vite.config.ts` (vitest config co-located) |
| Quick run command | `npx vitest run src/hooks/useProfile.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| SEC-01 | `updateTier` no longer calls `supabase.from('profiles').update({tier})` directly | unit | `npx vitest run src/hooks/useProfile.test.ts` | Yes (needs update) |
| SEC-01 | `updateTier` calls `supabase.functions.invoke('set-tier')` with correct body | unit | `npx vitest run src/hooks/useProfile.test.ts` | Yes (needs update) |
| SEC-02 | `set-tier` Edge Function validates JWT before updating tier | manual smoke | Run `supabase functions serve` + `curl` without auth header → expect 401 | No (new function) |
| SEC-03 | Profile `avatar_url` and `color_scheme` updates still work after migration | unit | `npx vitest run src/hooks/useProfile.test.ts` | Yes (existing tests cover) |
| SEC-03 | Dev tier toggle in SettingsPage still switches tier correctly | unit | `npx vitest run src/pages/SettingsPage.test.tsx` | Yes (needs update) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/hooks/useProfile.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No new test files needed — existing `useProfile.test.ts` and `SettingsPage.test.tsx` are updated in-place
- [ ] Migration file `20260323000001_profiles_tier_column_security.sql` — created in Wave 1
- [ ] Edge Function `supabase/functions/set-tier/index.ts` — created in Wave 1

*(Existing test infrastructure covers all phase requirements after in-place updates)*

---

## Sources

### Primary (HIGH confidence)
- [Supabase Column-Level Security Docs](https://supabase.com/docs/guides/database/postgres/column-level-security) — `REVOKE`/`GRANT` column syntax verified
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS UPDATE policy behavior confirmed
- Project source: `supabase/migrations/20260314000001_wheel_schema.sql` — exact current `profiles: update own` policy text
- Project source: `src/hooks/useProfile.ts` — exact current `updateTier` implementation
- Project source: `decisions.md` DEC-006 — locked decision context
- Project source: `src/pages/SettingsPage.tsx` — dev toggle implementation confirmed

### Secondary (MEDIUM confidence)
- [GitHub Supabase Discussion #656](https://github.com/orgs/supabase/discussions/656) — community confirmation that `WITH CHECK` cannot reference OLD row values; column-level GRANT is the correct path
- [PostgreSQL docs: CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html) — confirmed `WITH CHECK` is post-update value check only

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tooling already used in the project (Supabase migrations, Edge Functions, Vitest)
- Architecture: HIGH — column-level GRANT/REVOKE is verified from official Supabase docs; RLS limitation (`WITH CHECK` cannot see OLD) confirmed from PostgreSQL official docs
- Pitfalls: HIGH — derived directly from reading the actual migration files and test files in the project

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable Supabase PostgreSQL semantics; no fast-moving dependencies)
