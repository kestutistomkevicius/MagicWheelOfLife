# Pitfalls Research: JustAWheelOfLife

**Domain:** React + Supabase SaaS — assessments, snapshots, tier gating

---

## Critical Pitfalls

### P1: RLS Not Enabled by Default — Data Exposed

**What happens:** Every new Supabase table is created with RLS **disabled**. Any row is readable/writable via the REST API by anyone with the anon key (which is public in your frontend code).

**Warning signs:** You create a table, test it, it works. But you tested as the superuser (SQL Editor). All data is exposed.

**Prevention:**
```sql
-- Add to EVERY migration file, immediately after CREATE TABLE
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

**Phase:** Phase 1 — every table from day one.

---

### P2: Testing RLS in SQL Editor (Bypasses RLS)

**What happens:** The Supabase Studio SQL Editor and `supabase db reset` run as the `postgres` superuser, which bypasses all RLS policies. Your queries work fine in Studio but return empty results for real users.

**Warning signs:** "It works in Studio but returns nothing in the app."

**Prevention:**
- Always test auth-sensitive queries via the Supabase client SDK with a real user session
- Write RLS tests using `supabase.rpc()` or integration tests with Playwright that authenticate

**Phase:** Phase 1 — establish this habit immediately.

---

### P3: Missing `WITH CHECK` on Write Policies

**What happens:** An INSERT policy without `WITH CHECK` lets a user insert a row with `user_id = 'someone_elses_uuid'`. An UPDATE without `WITH CHECK` lets users change ownership.

**Example of the bug:**
```sql
-- WRONG: only checks reads, not what's written
CREATE POLICY "Users manage own wheels" ON wheels
  USING (user_id = auth.uid()); -- only covers SELECT/DELETE

-- RIGHT: covers both reads AND what can be written
CREATE POLICY "Users manage own wheels" ON wheels
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()); -- prevents forged user_id on INSERT/UPDATE
```

**Phase:** Phase 1 — all write policies.

---

### P4: Snapshot Data Mutation — History Corruption

**What happens:** If `snapshot_scores` stores a FK to `categories` instead of copying values, editing a category name or color after saving a snapshot corrupts all historical comparisons for that category.

**Example:** User saves "Q1 snapshot" with category "Health". Then renames "Health" → "Physical Health". Q1 snapshot now shows "Physical Health" — the rename rewrites history.

**Prevention:**
- `snapshot_scores` stores `category_name text` (value copy), NOT `category_id uuid` (FK)
- Same for `category_color`, `position`
- Scores are immutable once written to `snapshot_scores`
- Add a DB-level `IMMUTABLE` trigger or just don't expose UPDATE/DELETE RLS on `snapshot_scores`

**Phase:** Phase 1 schema design — extremely hard to fix retroactively.

---

### P5: Frontend-Only Free Tier Gating

**What happens:** You check `tier === 'free'` in React and show "you can't create another wheel." But the Supabase RLS INSERT policy doesn't enforce the limit. A user can call the Supabase API directly (via curl or browser console) and create unlimited wheels.

**Prevention:**
```sql
-- DB-level enforcement in RLS INSERT policy
CREATE POLICY "Free tier wheel limit" ON wheels
  FOR INSERT WITH CHECK (
    (SELECT tier FROM profiles WHERE id = auth.uid()) = 'premium'
    OR (SELECT COUNT(*) FROM wheels WHERE user_id = auth.uid()) < 1
  );
```

Frontend check is still valid for UX (show the upgrade prompt). DB policy is the security layer.

**Phase:** Phase 1 — when creating the wheels RLS policy.

---

### P6: Missing Indexes on Policy Columns

**What happens:** A policy `WHERE user_id = auth.uid()` causes a full sequential table scan if `user_id` is not indexed. Works fine with 10 rows, times out with 10,000.

**Prevention:**
```sql
-- Add to every table that has user_id in its RLS policy
CREATE INDEX ON wheels(user_id);
CREATE INDEX ON categories(wheel_id);
CREATE INDEX ON snapshots(wheel_id);
CREATE INDEX ON snapshot_scores(snapshot_id);
CREATE INDEX ON action_items(category_id);
```

**Phase:** Phase 1 migrations.

---

### P7: Auth Session Race Condition in React

**What happens:** React renders components before Supabase's `onAuthStateChange` fires. Data-fetching hooks run with no user session → empty results or 401 errors → flicker or error state on first load.

**Prevention:**
```typescript
// In AuthProvider: resolve session synchronously on mount
const [session, setSession] = useState<Session | null | undefined>(undefined)
// undefined = loading, null = not authed, Session = authed

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setSession(data.session))
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  )
  return () => subscription.unsubscribe()
}, [])

// Render loading spinner while session === undefined
if (session === undefined) return <LoadingSpinner />
```

**Phase:** Phase 1 — auth setup.

---

### P8: Radar Chart Edge Cases

**What happens:** Recharts' `<RadarChart>` behaves unexpectedly with:
- **1–2 categories:** Renders as a line, not a polygon — looks broken
- **12 categories:** Labels overlap on small screens
- **All zero scores:** Renders as a dot in the center — confusing for new users

**Prevention:**
- Enforce minimum 3 categories before rendering the chart (show a placeholder otherwise)
- Test with 3, 6, 8, and 12 categories during development
- For zero scores: render the chart with a placeholder state (e.g., dashed outline)
- Category label truncation at ~12 chars for displays with many segments

**Phase:** Phase 2 (wheel rendering) — validate all edge cases before shipping.

---

### P9: Views Bypass RLS

**What happens:** If you create a SQL view (e.g., for reporting), it runs as the `postgres` user by default and bypasses all RLS. Any authenticated user can query the view and see all rows.

**Prevention:**
```sql
-- Use SECURITY INVOKER to make the view respect RLS
CREATE VIEW my_view WITH (security_invoker = true) AS
  SELECT ...;
```

Avoid views entirely in Phase 1. If you use them later, always set `security_invoker = true`.

**Phase:** Ongoing — when adding views.

---

### P10: User Metadata in RLS Policies

**What happens:** `auth.jwt() -> 'user_metadata'` is set by the client and can be modified by the user. Using it in RLS policies (e.g., to check tier) is a security hole — user can escalate their own tier.

**Prevention:**
- Store tier in `profiles` table (controlled by your app, not by the user)
- RLS policies should join to `profiles` to check tier, never trust JWT user_metadata

**Phase:** Phase 1 — tier gating design.

---

## Lower Priority Pitfalls

| Pitfall | Phase | Risk |
|---------|-------|------|
| Regenerating Supabase types after each migration | All | Medium — type drift causes TS errors |
| Not enabling email confirmation | Phase 1 | Low during dev, Medium in production — bots can create accounts |
| Forgetting `ON DELETE CASCADE` on child tables | Phase 1 | Medium — orphaned rows if wheel is deleted |
| Hardcoded color values instead of Tailwind tokens | Phase 2 | Low — visual inconsistency |
| Rendering trend chart with < 3 snapshots | Phase 6 | Low — graceful empty state needed |
