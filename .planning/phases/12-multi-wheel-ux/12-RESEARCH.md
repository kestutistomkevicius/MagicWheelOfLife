# Phase 12: Multi-Wheel UX — Research

**Researched:** 2026-03-24
**Domain:** React state management, multi-instance hooks, seed data, Vitest
**Confidence:** HIGH

---

## Summary

Phase 12 fixes the multi-wheel experience for premium users. The phase has two success criteria: (1) a premium user with 2 wheels can select each wheel independently on TrendPage with correct snapshot data, and (2) the sidebar label reads "My wheels" when the user has more than 1 wheel.

After reading the full codebase, the conclusion is that both items are **already substantially implemented** in the source code. The "broken" characterisation in the phase description refers to a runtime UX gap, not missing code logic. The wheel selector UI exists in `TrendPage.tsx` (lines 120-130), the plural label logic exists in `Sidebar.tsx` (line 32), the seed data for the second wheel exists in `seed.sql` (Phase 8 block), and all 329 existing tests pass. What is broken in practice is the end-to-end experience: `useWheel` is instantiated as a separate hook instance per component (Sidebar, TrendPage, WheelPage, SnapshotsPage), which causes the `wheels` array to be independently fetched in each component. When TrendPage calls `selectWheel`, only its own hook instance updates — no shared state exists. Additionally the existing tests do not cover the user-facing interaction that proves wheel switching actually reloads snapshot data.

**Primary recommendation:** Write tests that cover the wheel-switching reload behavior, verify the seed data actually produces correct TrendPage results, and add a test for the sidebar plural label when `useWheel` returns 2 wheels.

---

## Current State Analysis

### What is already implemented (HIGH confidence — read source directly)

| Item | File | Line(s) | Status |
|------|------|---------|--------|
| Wheel selector `<select>` on TrendPage | `src/pages/TrendPage.tsx` | 120-130 | Implemented — renders when `wheels.length > 1` |
| `selectWheel` wired to onChange | `src/pages/TrendPage.tsx` | 123 | Implemented |
| `useEffect` re-runs on `wheel?.id` change | `src/pages/TrendPage.tsx` | 31, 63 | Implemented — dependency array is `[wheel?.id]` |
| Sidebar plural label logic | `src/components/Sidebar.tsx` | 32 | Implemented — `wheels.length > 1 ? 'My Wheels' : 'My Wheel'` |
| `useWheel` returns `wheels` array | `src/hooks/useWheel.ts` | 81-98 | Implemented — fetches all user wheels |
| `selectWheel` function in hook | `src/hooks/useWheel.ts` | 131-144 | Implemented — queries categories, sets `wheel` state |
| Second wheel seed data | `supabase/seed.sql` | 359-411 | Implemented (Phase 8) — `Work & Purpose` wheel with 3 snapshots |

### What is missing (HIGH confidence)

| Item | Gap |
|------|-----|
| Test for wheel-switching snapshot reload | No test verifies that switching wheels in TrendPage triggers a new `listSnapshots` call with the new wheel id |
| Test for Sidebar plural label | Existing `Sidebar.test.tsx` only tests with default mock which returns no `wheels` array from `useWheel`; the `useWheel` mock in Sidebar tests is absent — `useWheel` is not mocked at all in `Sidebar.test.tsx`, so the test hits a real hook call path |
| Manual/UAT verification of seed end-to-end | The phase description frames this as a UX fix, implying end-to-end runtime was broken or untested |

### The `useWheel` independent instance problem

`useWheel(userId)` is called independently in:
- `Sidebar.tsx` — for `wheels.length` to compute plural label
- `TrendPage.tsx` — for wheel selector and snapshot loading
- `WheelPage.tsx` — for full wheel editing experience
- `SnapshotsPage.tsx` — for wheel-scoped snapshot listing

Each call is a separate React hook instance with separate state. They do not share state. This is NOT a bug that needs fixing — it is the existing design. Each page fetches its own copy of data. The TrendPage `selectWheel` correctly updates only the TrendPage's hook instance, which is exactly what is needed: TrendPage should load snapshots for whichever wheel it has selected, independently of what WheelPage is showing.

The Sidebar's `useWheel` instance is only used for the `wheels.length` count — it always loads ALL user wheels and correctly shows plural when count > 1.

**Conclusion:** The architecture is correct. The UX gap is either: (a) a runtime bug in the data flow that manifests with real seed data, or (b) missing verification that the existing code actually works end-to-end with the seeded second wheel.

### Suspected actual runtime gap (MEDIUM confidence — not directly tested in browser)

The `useWheel` hook `fetchData()` function (lines 61-128) fetches all wheels with `.order('created_at')`. The Phase 8 seed inserts the second wheel with id `00000000-0000-0000-0000-000000000010` before the first wheel `00000000-0000-0000-0000-000000000012` numerically but the `created_at` of `00000000-0000-0000-0000-000000000012` was inserted in Phase 2 (earlier in seed.sql). The second wheel is inserted in Phase 8 block with no explicit `created_at`, so it gets `now()` — which means `activeWheels[0]` (the first active wheel alphabetically by created_at) will be `00000000-0000-0000-0000-000000000012` (My Wheel, Phase 2). This ordering should be correct. The seed data for wheel 2 has 3 snapshots, sufficient for TrendPage.

The most likely real issue: the Sidebar test at line 38 tests for `my wheel` (singular) because `useWheel` is NOT mocked in `Sidebar.test.tsx`. Looking at the test file, `useWheel` IS called but there is no `vi.mock('@/hooks/useWheel')` — this means the hook runs against a mocked Supabase client that returns empty data, producing `wheels: []`, which means `wheelLabel` = `'My Wheel'`. A test for the plural label is simply missing.

---

## Standard Stack

### Core (no new dependencies needed — HIGH confidence)

All code uses existing stack. Phase 12 is pure logic/test/seed work.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component state | Already in use |
| Vitest + RTL | 3.2.4 | Unit tests | Already in use |
| `@testing-library/user-event` | 14.x | User interaction in tests | Already in use |
| Supabase JS | 2.x | DB queries | Already in use |

**Installation:** None required. No new dependencies.

---

## Architecture Patterns

### Pattern 1: `useWheel` independent instances (existing pattern)

**What:** Each page/component that needs wheel data calls `useWheel(userId)` directly. They are independent hook instances. No shared context.

**When to use:** Acceptable because each page needs different slices of wheel data (TrendPage needs snapshot data, WheelPage needs category editing, Sidebar needs only wheel count).

**Key implication for Phase 12:** Do NOT introduce a shared WheelContext or lift state — that would be a large refactor beyond phase scope. Each page owns its wheel selection state.

### Pattern 2: `useEffect` keyed on `wheel?.id` for data reloading

**What:** TrendPage's snapshot loading effect has dependency `[wheel?.id]`. When `selectWheel` sets a new `wheel` state, the effect re-fires with the new wheel id and loads new snapshot data.

**Verification needed:** A test should confirm that after calling `selectWheel('wheel-2')`, the `listSnapshots` mock is called with `'wheel-2'` (not `'wheel-1'`).

```typescript
// Source: src/pages/TrendPage.tsx lines 31-63
useEffect(() => {
  if (!wheel?.id) return
  // ... loads snapshots for wheel.id
}, [wheel?.id])  // re-fires when wheel changes
```

### Pattern 3: Sidebar `useWheel` for label only

**What:** Sidebar calls `useWheel(userId)` but only uses `wheels` (the full array). It does not use `selectWheel` — the sidebar does not allow wheel switching. Wheel switching is a page-level concern.

**Sidebar test gap:** `Sidebar.test.tsx` has no mock for `useWheel`. In tests, the hook runs against a mocked Supabase client (from `src/test/setup.ts`) returning empty data, so `wheels` is always `[]` and the plural path is never tested.

### Anti-Patterns to Avoid

- **Do NOT introduce a shared WheelContext** to synchronize `useWheel` state across components. The Phase 12 scope is narrowly "fix broken multi-wheel UX" — the existing independent-instance pattern works for TrendPage's use case.
- **Do NOT change `selectWheel` to persist selection** across page navigations. Each page resets to the first wheel on mount, which is the existing intentional behavior.
- **Do NOT add a wheel selector to SnapshotsPage** in this phase — not in scope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wheel state sharing across routes | Custom WheelContext provider | None needed (per-page works) | Would be over-engineering for 2-wheel use case; Context adds complexity and re-render surface |
| DB wheel ordering | Custom sort | `ORDER BY created_at` (already in useWheel) | SQL-level sort is reliable and already implemented |

---

## Common Pitfalls

### Pitfall 1: Missing `useWheel` mock in Sidebar tests
**What goes wrong:** Sidebar tests pass but never exercise the plural label branch because `useWheel` returns empty `wheels` array without a mock.
**Why it happens:** The Sidebar component was tested before it called `useWheel` for label logic; the mock was never added.
**How to avoid:** Add `vi.mock('@/hooks/useWheel', ...)` in `Sidebar.test.tsx` and add a test case for `wheels.length > 1`.
**Warning signs:** No test case matching `my wheels` (plural) in Sidebar.test.tsx.

### Pitfall 2: Wheel selector re-render loop
**What goes wrong:** If `selectWheel` is an async function and called with `void` in an `onChange` handler, a missing `await` or state update during render could cause loop.
**Why it happens:** TrendPage already uses `onChange={e => void selectWheel(e.target.value)}` — the `void` operator suppresses the promise. This is correct.
**How to avoid:** Keep the existing pattern. Do not convert to a sync handler.

### Pitfall 3: `setSelectedCategory` stale value after wheel switch
**What goes wrong:** When switching from Wheel A (categories: Health, Career) to Wheel B (categories: Career, Finance, Purpose), `selectedCategory` retains its old value ('Health') which may not exist in Wheel B's scores. Chart shows empty data.
**Why it happens:** The TrendPage effect resets `selectedCategory` to `cats[0]` only if `cats.length > 0` after loading. This is already handled in lines 53-54.
**How to avoid:** Verify the reset logic fires correctly. The existing code handles this correctly — when the effect re-runs on wheel change, it calls `setSelectedCategory(cats[0])` with the new wheel's categories.

### Pitfall 4: Seed data `ON CONFLICT DO NOTHING` for snapshots
**What goes wrong:** If `supabase db reset` is run, the Phase 8 seed block uses `ON CONFLICT DO NOTHING` for snapshot rows. If snapshots already exist from a partial seed run, new ones won't be inserted.
**Why it happens:** Phase 8 used `ON CONFLICT DO NOTHING` for snapshot_scores.
**How to avoid:** No action needed — `supabase db reset` wipes and recreates from scratch. `ON CONFLICT DO NOTHING` is safe after a full reset.

---

## Code Examples

### Adding `useWheel` mock to Sidebar tests

```typescript
// Source: pattern from TrendPage.test.tsx (useWheel hoisted mock)
const { mockUseWheel } = vi.hoisted(() => {
  const mockUseWheel = vi.fn()
  return { mockUseWheel }
})

vi.mock('@/hooks/useWheel', () => ({
  useWheel: (...args: unknown[]) => mockUseWheel(...args),
}))

// In beforeEach:
mockUseWheel.mockReturnValue({
  wheel: null,
  wheels: [],
  // ... other fields
})

// Plural label test:
it('shows "My wheels" label when user has more than 1 wheel', () => {
  mockUseWheel.mockReturnValue({
    wheel: { id: 'w1', name: 'Wheel 1' },
    wheels: [{ id: 'w1', name: 'Wheel 1' }, { id: 'w2', name: 'Work Wheel' }],
    // ...
  })
  render(<MemoryRouter><Sidebar /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /my wheels/i })).toBeInTheDocument()
})
```

### Verifying TrendPage wheel-switch reload

```typescript
// Source: pattern from existing TrendPage.test.tsx wheel selector tests
it('reloads snapshots for the newly selected wheel when wheel is switched', async () => {
  const wheel2 = { id: 'wheel-2', name: 'Work Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
  mockUseWheel.mockReturnValue({
    wheel: mockWheel,
    wheels: [mockWheel, wheel2],
    categories: mockCategories,
    selectWheel: mockSelectWheel,
    // ...
  })
  mockListSnapshots.mockResolvedValue([])

  render(<TrendPage />)
  await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

  // After switching, useWheel's selectWheel updates wheel state
  // The effect re-fires with new wheel.id — verify listSnapshots called with wheel-2
  // (This requires mockSelectWheel to update the mockUseWheel return value — use mockImplementation)
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single wheel per user | Multi-wheel (premium) with `useWheel` returning `wheels[]` | Phase 2/7 | Premium users can create unlimited wheels |
| Hardcoded `'My Wheel'` label | Dynamic label from `wheels.length` | Phase 8 (deferred item) | Already coded but untested |
| No wheel selector on TrendPage | `<select>` rendered when `wheels.length > 1` | Phase 8 (CONTENT-05) | Already coded, seed data exists |

**Deprecated/outdated:**
- None — no deprecated patterns in the relevant code.

---

## Open Questions

1. **Is there an actual runtime bug, or just missing test coverage?**
   - What we know: All code paths for multi-wheel appear implemented. All 329 tests pass.
   - What's unclear: Whether manual testing against local Supabase reveals a runtime UX failure.
   - Recommendation: Plan Wave 0 as "run Supabase, log in as premium@test.com, navigate to TrendPage, verify wheel selector shows 2 wheels and switching works." If it works, Phase 12 is purely a test/verification phase.

2. **Should `selectWheel` also reset `snapshots` and `allScores` state synchronously before the async reload?**
   - What we know: Currently, switching wheels shows the old data briefly while new data loads (because `setLoading(true)` is set inside the async `load()` function but not before it).
   - What's unclear: Whether this loading flash is acceptable UX or needs a fix.
   - Recommendation: Add `setSnapshots([]); setAllScores([])` before `setLoading(true)` in the effect to clear stale data immediately on wheel switch.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react |
| Config file | `vite.config.ts` (test block) |
| Quick run command | `npx vitest run src/components/Sidebar.test.tsx src/pages/TrendPage.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| MW-01 | Premium user with 2 wheels can select each wheel independently on TrendPage with correct snapshot data | unit | `npx vitest run src/pages/TrendPage.test.tsx` | Yes — but new test case needed |
| MW-02 | Sidebar label reads "My wheels" when user has more than 1 wheel | unit | `npx vitest run src/components/Sidebar.test.tsx` | Yes — but new test case needed |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/Sidebar.test.tsx src/pages/TrendPage.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test case in `src/components/Sidebar.test.tsx` — covers MW-02 (plural label when `wheels.length > 1`)
- [ ] New test case in `src/pages/TrendPage.test.tsx` — covers MW-01 (snapshot reload after wheel switch)

*(Both test FILES already exist; only new test cases within them are needed.)*

---

## Sources

### Primary (HIGH confidence)
- `src/pages/TrendPage.tsx` — direct source read; wheel selector UI confirmed present
- `src/components/Sidebar.tsx` — direct source read; plural label logic confirmed present
- `src/hooks/useWheel.ts` — direct source read; `selectWheel`, `wheels[]`, `useEffect` dependency confirmed
- `src/pages/TrendPage.test.tsx` — direct source read; existing wheel selector tests confirmed present
- `src/components/Sidebar.test.tsx` — direct source read; confirmed no `useWheel` mock present
- `supabase/seed.sql` — direct source read; Phase 8 second wheel seed confirmed present

### Secondary (MEDIUM confidence)
- `.planning/PHASES-FORWARD-DRAFT.md` — Phase 12 scope definition: "TrendPage wheel selector seed data + sidebar label pluralise"
- `.planning/STATE.md` — prior decisions and deferred items confirming both items were noted as deferred in Phase 8

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing Vitest + RTL pattern
- Architecture: HIGH — code read directly; independent `useWheel` instance pattern is intentional
- Pitfalls: HIGH — all pitfalls derived from reading actual source code, not speculation
- Open questions: MEDIUM — runtime behavior not verified in browser, only from code analysis

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase; only changes if useWheel or TrendPage are modified)
