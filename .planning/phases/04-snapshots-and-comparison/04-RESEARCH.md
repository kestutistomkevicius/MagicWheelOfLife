# Phase 4: Snapshots & Comparison - Research

**Researched:** 2026-03-15
**Domain:** Supabase snapshot schema, Recharts multi-series RadarChart overlay, React comparison UI, score history table
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SNAP-01 | User can manually save a snapshot with a user-provided name; snapshot name is auto-appended with the current date | New `snapshots` table + `snapshot_scores` table; INSERT triggered by a "Save Snapshot" button with a name input; display name is stored as-is, date auto-appended at save time |
| SNAP-02 | User can view a chronological list of all saved snapshots | SELECT from `snapshots` ordered by `saved_at` DESC; rendered as a list in SnapshotsPage with name + formatted date |
| COMP-01 | User can select any two snapshots and view an overlay comparison: both wheels drawn on the same radar chart canvas in different colors | Load `snapshot_scores` for two selected snapshot IDs; merge into Recharts RadarChart data array with four dataKeys (snap1_asis, snap1_tobe, snap2_asis, snap2_tobe); four `<Radar>` elements in two color pairs |
| COMP-02 | User can select a category and view a score history table: as-is and to-be values for that category across all saved snapshots | Query all `snapshot_scores` for a wheel + category_name; render as a table rows sorted by `saved_at` |
</phase_requirements>

---

## Summary

Phase 4 adds snapshot saves and comparison to the existing wheel. Three technical areas drive the work.

First, the **database schema**: two new tables — `snapshots` (one row per save event: name, wheel_id, user_id, saved_at) and `snapshot_scores` (one row per category per snapshot: category_name as text copy, score_asis, score_tobe). Storing `category_name` as a text copy in `snapshot_scores` is the correct design decision already established in the project notes ("snapshot immutability: snapshot_scores stores value copies, not FK to categories"). This means snapshots remain historically accurate even if the user later renames or removes a category. No FK to the live `categories` table.

Second, **the overlay chart** (COMP-01): the existing `WheelChart` component renders two `<Radar>` series (as-is + to-be). The comparison view needs four series: snap1 as-is, snap1 to-be, snap2 as-is, snap2 to-be — two color pairs distinguishing the two snapshots. This requires either a new `ComparisonChart` component that accepts two snapshot data sets, or extending `WheelChart` to accept an optional second dataset. A new dedicated component is the cleaner path given the different data shape and color scheme.

Third, **the score history table** (COMP-02): a simple HTML table showing each snapshot's date, name, and the selected category's as-is / to-be scores. Category selection is a `<select>` element populated from category names discovered in the snapshot data. No new library needed.

The phase also activates the previously-hardcoded `hasSnapshots = false` in `WheelPage.tsx` — that constant must now query the real `snapshots` table to determine whether rename/remove warnings should trigger.

**Primary recommendation:** DB migration first (snapshots + snapshot_scores tables, RLS, seed data), then a `useSnapshots` hook (save, list, fetch scores for comparison), then a `ComparisonChart` component, then wire SnapshotsPage with the full UI. Follow the established hook-first pattern from Phases 2 and 3.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.x (installed) | Four-series RadarChart for overlay comparison | Already in use for WheelChart; same API for multi-series |
| @supabase/supabase-js | ^2.x (installed) | snapshots + snapshot_scores CRUD | Project stack |
| react | ^19.x (installed) | UI state for snapshot selection, comparison picker | Project stack |
| tailwindcss | ^3.x (installed) | Styling for comparison layout, table | Project stack |

### shadcn/ui Components (no new installs required)
All needed shadcn components are already installed from prior phases:
- `Dialog` — used for the "Save Snapshot" name input modal
- `AlertDialog` — already installed; not needed for this phase
- `Button`, `Input`, `Label` — already installed

**No new npm packages required for this phase.**

### Recharts — Four-Series Overlay (extends existing WheelChart pattern)
The existing `WheelChart` component accepts a single `WheelChartPoint[]` with `asis` and `tobe` fields. The comparison view needs a different data shape. A new `ComparisonChart` component handles this cleanly.

**No new library installs. No `--legacy-peer-deps`.**

---

## Architecture Patterns

### Recommended File Additions for Phase 4
```
src/
├── components/
│   ├── ComparisonChart.tsx          # Four-series RadarChart for overlay (new)
│   └── SnapshotNameDialog.tsx       # "Save Snapshot" name input dialog (new)
├── hooks/
│   └── useSnapshots.ts              # save, list, fetchScores (new)
├── pages/
│   └── SnapshotsPage.tsx            # Replace placeholder — full UI (update)
├── types/
│   └── database.ts                  # Add SnapshotRow, SnapshotScoreRow (update)
supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_snapshots.sql # snapshots + snapshot_scores tables + RLS (new)
└── seed.sql                         # Add Phase 4 block: 4 snapshots for premium user (update)
```

WheelPage.tsx receives one targeted update: replace `const hasSnapshots = false` with a real Supabase count query.

### Pattern 1: Database Schema — snapshots + snapshot_scores
**What:** Two tables. `snapshots` is the save event record. `snapshot_scores` stores immutable score copies at save time. Category names are stored as text in `snapshot_scores`, not as FKs to `categories` — this preserves historical accuracy regardless of future category renames or deletions.
**When to use:** Always. This is the only schema design that satisfies snapshot immutability.

```sql
-- Migration: snapshots + snapshot_scores tables

CREATE TABLE public.snapshots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id   uuid        NOT NULL REFERENCES public.wheels(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  saved_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots: select own" ON public.snapshots
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "snapshots: insert own" ON public.snapshots
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE policy: snapshots are immutable once saved
-- (v2 will add rename via SNAP-V2-02 if needed)

CREATE POLICY "snapshots: delete own" ON public.snapshots
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- snapshot_scores: one row per category per snapshot
-- category_name stored as text copy — NOT a FK to categories
CREATE TABLE public.snapshot_scores (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   uuid    NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name text    NOT NULL,
  position      integer NOT NULL DEFAULT 0,  -- preserves category order at save time
  score_asis    integer NOT NULL CHECK (score_asis BETWEEN 1 AND 10),
  score_tobe    integer NOT NULL CHECK (score_tobe BETWEEN 1 AND 10)
);

ALTER TABLE public.snapshot_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshot_scores: select own" ON public.snapshot_scores
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "snapshot_scores: insert own" ON public.snapshot_scores
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE or DELETE on snapshot_scores: immutable once written
-- (Deleting a snapshot cascades to its scores via FK ON DELETE CASCADE)
```

**Key design decisions:**
- `user_id` denormalized on `snapshot_scores` (same rationale as `categories` and `action_items`) — RLS needs no join
- `position` column on `snapshot_scores` — preserves the category display order that was in effect when the snapshot was saved; used for deterministic chart ordering
- No `updated_at` on either table — snapshots are immutable by design
- `saved_at` is `timestamptz NOT NULL DEFAULT now()` — not a user-editable column; always the server-side save time
- No UPDATE RLS policies — snapshots cannot be mutated after creation (v2 adds rename if needed via SNAP-V2-02)

### Pattern 2: useSnapshots Hook
**What:** Stateless mutations hook following the project's established pattern (same shape as `useActionItems`). Three operations: `saveSnapshot`, `listSnapshots`, `fetchSnapshotScores`.
**When to use:** Always. Keep Supabase calls out of components.

```typescript
// src/hooks/useSnapshots.ts
import { supabase } from '@/lib/supabase'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

export interface SaveSnapshotParams {
  wheelId: string
  userId: string
  name: string
  categories: Array<{
    name: string
    position: number
    score_asis: number
    score_tobe: number
  }>
}

export interface UseSnapshotsResult {
  saveSnapshot: (params: SaveSnapshotParams) => Promise<SnapshotRow | { error: string }>
  listSnapshots: (wheelId: string) => Promise<SnapshotRow[]>
  fetchSnapshotScores: (snapshotId: string) => Promise<SnapshotScoreRow[]>
  checkSnapshotsExist: (wheelId: string) => Promise<boolean>
}

export function useSnapshots(): UseSnapshotsResult {
  async function saveSnapshot(params: SaveSnapshotParams): Promise<SnapshotRow | { error: string }> {
    const { wheelId, userId, name, categories } = params

    // Insert the snapshot record
    const snapRes = await supabase
      .from('snapshots')
      .insert({ wheel_id: wheelId, user_id: userId, name: name.trim() })
      .select()

    const snaps = Array.isArray(snapRes.data) ? (snapRes.data as SnapshotRow[]) : []
    const snap = snaps[0]
    if (!snap || snapRes.error) {
      return { error: snapRes.error?.message ?? 'Failed to save snapshot' }
    }

    // Insert score copies for each category
    const scoreRows = categories.map(cat => ({
      snapshot_id: snap.id,
      user_id: userId,
      category_name: cat.name,
      position: cat.position,
      score_asis: cat.score_asis,
      score_tobe: cat.score_tobe,
    }))

    const scoresRes = await supabase.from('snapshot_scores').insert(scoreRows)
    if (scoresRes.error) {
      return { error: scoresRes.error.message }
    }

    return snap
  }

  async function listSnapshots(wheelId: string): Promise<SnapshotRow[]> {
    const res = await supabase
      .from('snapshots')
      .select('id, wheel_id, user_id, name, saved_at')
      .eq('wheel_id', wheelId)
      .order('saved_at', { ascending: false })
    return Array.isArray(res.data) ? (res.data as SnapshotRow[]) : []
  }

  async function fetchSnapshotScores(snapshotId: string): Promise<SnapshotScoreRow[]> {
    const res = await supabase
      .from('snapshot_scores')
      .select('id, snapshot_id, user_id, category_name, position, score_asis, score_tobe')
      .eq('snapshot_id', snapshotId)
      .order('position', { ascending: true })
    return Array.isArray(res.data) ? (res.data as SnapshotScoreRow[]) : []
  }

  async function checkSnapshotsExist(wheelId: string): Promise<boolean> {
    const res = await supabase
      .from('snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('wheel_id', wheelId)
    return (res.count ?? 0) > 0
  }

  return { saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist }
}
```

### Pattern 3: SnapshotNameDialog — Save Snapshot UI
**What:** A shadcn `Dialog` with a text input for the snapshot name. On confirm, calls `saveSnapshot`. The display name in the list is `${name} — ${date}` — the date is appended in the UI at render time, not stored in the `name` column.
**When to use:** Triggered from a "Save snapshot" button on WheelPage or SnapshotsPage.

```typescript
// src/components/SnapshotNameDialog.tsx
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface SnapshotNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => Promise<void>
  isSaving: boolean
}

export function SnapshotNameDialog({ open, onOpenChange, onSave, isSaving }: SnapshotNameDialogProps) {
  const [name, setName] = useState('')
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  async function handleSave() {
    if (!name.trim()) return
    await onSave(name.trim())
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Snapshot</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="snap-name">Snapshot name</Label>
            <Input
              id="snap-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSave() }}
              placeholder="e.g. Q1 Review"
              autoFocus
            />
          </div>
          <p className="text-xs text-stone-400">
            Will be saved as: <strong>{name.trim() || 'My snapshot'} — {today}</strong>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={!name.trim() || isSaving}>
            {isSaving ? 'Saving…' : 'Save snapshot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Key detail:** The displayed name in the snapshot list is rendered as `${snapshot.name} — ${formattedDate(snapshot.saved_at)}`. The `name` column stores only the user-provided text. The date portion is always the actual `saved_at` timestamp, formatted at render time.

### Pattern 4: ComparisonChart — Four-Series Overlay
**What:** A new component that accepts two snapshot score arrays and renders four `<Radar>` series in two color pairs. Built on the same Recharts RadarChart API as the existing `WheelChart`.
**When to use:** COMP-01 comparison view, always.

```typescript
// src/components/ComparisonChart.tsx
// Source: https://recharts.github.io/en-US/api/Radar/
import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'
import type { SnapshotScoreRow } from '@/types/database'

export type ComparisonChartPoint = {
  category: string
  snap1_asis: number
  snap1_tobe: number
  snap2_asis: number
  snap2_tobe: number
}

interface ComparisonChartProps {
  snap1Scores: SnapshotScoreRow[]
  snap2Scores: SnapshotScoreRow[]
  snap1Label: string  // e.g. "Q1 Review — 15 Mar 2026"
  snap2Label: string
}

export function ComparisonChart({ snap1Scores, snap2Scores, snap1Label, snap2Label }: ComparisonChartProps) {
  // Build merged data by category name
  const allCategories = Array.from(
    new Set([
      ...snap1Scores.map(s => s.category_name),
      ...snap2Scores.map(s => s.category_name),
    ])
  )

  const snap1Map = Object.fromEntries(snap1Scores.map(s => [s.category_name, s]))
  const snap2Map = Object.fromEntries(snap2Scores.map(s => [s.category_name, s]))

  const data: ComparisonChartPoint[] = allCategories.map(cat => ({
    category: cat,
    snap1_asis: snap1Map[cat]?.score_asis ?? 0,
    snap1_tobe: snap1Map[cat]?.score_tobe ?? 0,
    snap2_asis: snap2Map[cat]?.score_asis ?? 0,
    snap2_tobe: snap2Map[cat]?.score_tobe ?? 0,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-stone-400 text-sm">
        No data to compare
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} />
        {/* Snapshot 1: amber tones */}
        <Radar name={`${snap1Label} (As-Is)`}  dataKey="snap1_asis" stroke="#e8a23a" fill="#e8a23a" fillOpacity={0.35} dot={false} />
        <Radar name={`${snap1Label} (To-Be)`}  dataKey="snap1_tobe" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1}  dot={false} />
        {/* Snapshot 2: blue tones */}
        <Radar name={`${snap2Label} (As-Is)`}  dataKey="snap2_asis" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.35} dot={false} />
        <Radar name={`${snap2Label} (To-Be)`}  dataKey="snap2_tobe" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1}  dot={false} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
```

**Ordering note:** Category ordering in the overlay chart should follow the position from `snap1Scores` (or whichever snapshot was saved first). Categories that exist in only one snapshot get a score of 0 for the other — this makes the gap visually obvious.

### Pattern 5: Score History Table — COMP-02
**What:** A table showing each snapshot's name, date, and a selected category's as-is and to-be scores. A `<select>` lets the user pick which category to inspect. Data is sourced by fetching all `snapshot_scores` for the wheel, grouped by snapshot.
**When to use:** The lower section of SnapshotsPage when snapshots exist.

```typescript
// Fetch strategy: load all snapshot_scores for the wheel in one query
// Filter client-side by selected category_name
const { data: allScores } = await supabase
  .from('snapshot_scores')
  .select('snapshot_id, category_name, score_asis, score_tobe')
  .in('snapshot_id', snapshotIds)  // snapshotIds from listSnapshots
  .order('category_name')

// Derive unique category names for the select dropdown
const categoryNames = Array.from(new Set(allScores.map(s => s.category_name))).sort()
```

Rendered table (for selected category):
```
| Snapshot name          | Date        | As-Is | To-Be |
|------------------------|-------------|-------|-------|
| Q1 Review — 15 Mar 26 | 15 Mar 2026 |   5   |   8   |
| Q2 Review — 15 Jun 26 | 15 Jun 2026 |   6   |   8   |
```

Rows are sorted by `saved_at` ascending (oldest first) so progress reads left-to-right / top-to-bottom.

### Pattern 6: SnapshotsPage Layout
**What:** The existing `SnapshotsPage.tsx` is a placeholder ("Coming soon"). Phase 4 replaces it with a real page containing three sections:
1. **Header + Save button**: wheel name, "Save snapshot" button that opens `SnapshotNameDialog`
2. **Snapshot list + comparison picker** (SNAP-01, SNAP-02, COMP-01): chronological list; user selects two snapshots via radio/checkbox; `ComparisonChart` renders below the list
3. **Score history table** (COMP-02): category select + table

The page uses `useWheel` context (passed via props or fetched directly) to know `wheelId`. It instantiates `useSnapshots`.

### Pattern 7: WheelPage hasSnapshots Activation
**What:** Replace the hardcoded `const hasSnapshots = false` in `WheelPage.tsx` with a real Supabase check using `checkSnapshotsExist` from `useSnapshots`. This enables the rename/remove warning dialogs that have been wired but never triggered.
**When to use:** During Phase 4 as part of the snapshots migration plan.

```typescript
// WheelPage.tsx — replace the hardcoded constant
const { checkSnapshotsExist } = useSnapshots()
const [hasSnapshots, setHasSnapshots] = useState(false)

useEffect(() => {
  if (!wheel?.id) return
  checkSnapshotsExist(wheel.id).then(exists => setHasSnapshots(exists))
}, [wheel?.id])
```

### Pattern 8: TypeScript Types — SnapshotRow, SnapshotScoreRow
Add to `src/types/database.ts`:

```typescript
export type SnapshotRow = {
  id: string
  wheel_id: string
  user_id: string
  name: string
  saved_at: string  // ISO timestamptz
}

export type SnapshotScoreRow = {
  id: string
  snapshot_id: string
  user_id: string
  category_name: string
  position: number
  score_asis: number
  score_tobe: number
}
```

Add to the `Database` type:
```typescript
snapshots: {
  Row: SnapshotRow
  Insert: Omit<SnapshotRow, 'id' | 'saved_at'>
  Update: never  // immutable
  Relationships: []
}
snapshot_scores: {
  Row: SnapshotScoreRow
  Insert: Omit<SnapshotScoreRow, 'id'>
  Update: never  // immutable
  Relationships: []
}
```

### Pattern 9: Seed Data — 4 Snapshots for Premium User
The seed.sql already documents the intended snapshot score story for the premium user (4 quarterly snapshots over 12 months). Phase 4 adds this block. Uses `premium_wheel_id = 00000000-0000-0000-0000-000000000012` (deterministic UUID from Phase 2 seed).

```sql
-- Phase 4 seed: snapshots for premium user
-- Score story: Career improves, Health dips then recovers, Relationships decline
DO $$
DECLARE
  premium_user_id  uuid := '00000000-0000-0000-0000-000000000002';
  premium_wheel_id uuid := '00000000-0000-0000-0000-000000000012';
  snap1_id uuid := '00000000-0000-0000-0000-000000000101';
  snap2_id uuid := '00000000-0000-0000-0000-000000000102';
  snap3_id uuid := '00000000-0000-0000-0000-000000000103';
  snap4_id uuid := '00000000-0000-0000-0000-000000000104';
BEGIN
  -- Insert 4 snapshots with backdated saved_at timestamps
  INSERT INTO public.snapshots (id, wheel_id, user_id, name, saved_at) VALUES
    (snap1_id, premium_wheel_id, premium_user_id, 'Q1 Annual Review',  now() - interval '12 months'),
    (snap2_id, premium_wheel_id, premium_user_id, 'Mid-Year Check-In', now() - interval '9 months'),
    (snap3_id, premium_wheel_id, premium_user_id, 'Q3 Progress',       now() - interval '6 months'),
    (snap4_id, premium_wheel_id, premium_user_id, 'Year End Review',   now() - interval '3 months')
  ON CONFLICT DO NOTHING;

  -- Snapshot 1 scores (12 months ago)
  INSERT INTO public.snapshot_scores (snapshot_id, user_id, category_name, position, score_asis, score_tobe) VALUES
    (snap1_id, premium_user_id, 'Health',               0, 6, 8),
    (snap1_id, premium_user_id, 'Career',               1, 5, 9),
    (snap1_id, premium_user_id, 'Relationships',        2, 8, 8),
    (snap1_id, premium_user_id, 'Finance',              3, 4, 8),
    (snap1_id, premium_user_id, 'Fun & Recreation',     4, 7, 7),
    (snap1_id, premium_user_id, 'Personal Growth',      5, 5, 9),
    (snap1_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap1_id, premium_user_id, 'Family & Friends',     7, 7, 7)
  ON CONFLICT DO NOTHING;

  -- Snapshot 2 scores (9 months ago)
  INSERT INTO public.snapshot_scores (snapshot_id, user_id, category_name, position, score_asis, score_tobe) VALUES
    (snap2_id, premium_user_id, 'Health',               0, 5, 8),
    (snap2_id, premium_user_id, 'Career',               1, 6, 9),
    (snap2_id, premium_user_id, 'Relationships',        2, 7, 8),
    (snap2_id, premium_user_id, 'Finance',              3, 4, 8),
    (snap2_id, premium_user_id, 'Fun & Recreation',     4, 6, 7),
    (snap2_id, premium_user_id, 'Personal Growth',      5, 6, 9),
    (snap2_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap2_id, premium_user_id, 'Family & Friends',     7, 6, 7)
  ON CONFLICT DO NOTHING;

  -- Snapshot 3 scores (6 months ago)
  INSERT INTO public.snapshot_scores (snapshot_id, user_id, category_name, position, score_asis, score_tobe) VALUES
    (snap3_id, premium_user_id, 'Health',               0, 6, 8),
    (snap3_id, premium_user_id, 'Career',               1, 7, 9),
    (snap3_id, premium_user_id, 'Relationships',        2, 6, 8),
    (snap3_id, premium_user_id, 'Finance',              3, 5, 8),
    (snap3_id, premium_user_id, 'Fun & Recreation',     4, 5, 7),
    (snap3_id, premium_user_id, 'Personal Growth',      5, 7, 9),
    (snap3_id, premium_user_id, 'Physical Environment', 6, 6, 7),
    (snap3_id, premium_user_id, 'Family & Friends',     7, 5, 7)
  ON CONFLICT DO NOTHING;

  -- Snapshot 4 scores (3 months ago)
  INSERT INTO public.snapshot_scores (snapshot_id, user_id, category_name, position, score_asis, score_tobe) VALUES
    (snap4_id, premium_user_id, 'Health',               0, 7, 8),
    (snap4_id, premium_user_id, 'Career',               1, 8, 9),
    (snap4_id, premium_user_id, 'Relationships',        2, 5, 7),
    (snap4_id, premium_user_id, 'Finance',              3, 6, 8),
    (snap4_id, premium_user_id, 'Fun & Recreation',     4, 4, 7),
    (snap4_id, premium_user_id, 'Personal Growth',      5, 7, 9),
    (snap4_id, premium_user_id, 'Physical Environment', 6, 7, 7),
    (snap4_id, premium_user_id, 'Family & Friends',     7, 5, 7)
  ON CONFLICT DO NOTHING;

END $$;
```

Deterministic snapshot UUIDs (0101–0104) allow Phase 5 (Trend Chart) to reference seed snapshots without runtime queries.

### Anti-Patterns to Avoid
- **Storing a FK to `categories` in `snapshot_scores`:** If the category is renamed or deleted, the historical snapshot becomes inconsistent or broken. Always store `category_name` as a text copy at save time.
- **Storing the date in the snapshot `name` column:** The date portion of the displayed snapshot label must always reflect the actual `saved_at` timestamp, not user-provided text. Store only the user's name; append the date at render time.
- **Loading snapshot_scores for all snapshots on page mount eagerly:** If a wheel has 20 snapshots, this is 20+ rows × 8 categories = 160 rows minimum. Use lazy loading: fetch scores only when a snapshot is selected for comparison.
- **Using the same color scheme for both snapshots:** The comparison chart becomes unreadable if both snapshots use the same colors. Always use two distinct color pairs (e.g., amber vs. blue) that visually separate the two selected snapshots.
- **Missing UPDATE/DELETE RLS policies gap:** snapshot_scores should have no UPDATE policy (scores are immutable). Verify Studio shows no UPDATE policy — this is intentional and should be documented.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-series radar overlay | Custom SVG polygon overlay | Recharts RadarChart with 4 `<Radar>` elements | Recharts handles N-series on the same chart; already used and tested in this project |
| Snapshot name dialog | Custom modal component | shadcn Dialog (already installed) | Focus management, Escape key, backdrop click handled; consistent with project's existing modal pattern |
| Date formatting | `new Date().toLocaleDateString()` with raw ISO strings | Standard JS `Date` + `toLocaleDateString()` with explicit locale/options | Use `{ day: '2-digit', month: 'short', year: 'numeric' }` options for consistent "15 Mar 2026" format; always pass the locale |
| Score history table | Third-party data table library | Plain HTML `<table>` with Tailwind | A simple 3-column table with a category select is trivial; no library needed for this scope |
| hasSnapshots check | Hardcoded `false` (current Phase 2 stub) | `checkSnapshotsExist()` querying real `snapshots` table | The Phase 2 code already has the warning dialog wired; only the check function needs to be real now |

**Key insight:** The snapshot system's complexity is almost entirely in the database design (immutability via text copy) and in the chart rendering (correct merging of two snapshot datasets). Both are solved with existing tools already in the project.

---

## Common Pitfalls

### Pitfall 1: Snapshot Name Includes the Date in the DB
**What goes wrong:** Developer stores "Q1 Review — 15 Mar 2026" in the `name` column. If the product later allows snapshot rename (v2 SNAP-V2-02), the old date is now baked in and can't be separated from the user-provided name.
**Why it happens:** Conflating display format with storage.
**How to avoid:** Store only the user-provided name (e.g., "Q1 Review"). At render time: `${snapshot.name} — ${formatDate(snapshot.saved_at)}`. The date is always the real `saved_at`, formatted client-side.
**Warning signs:** Snapshot name column contains a dash followed by a date string.

### Pitfall 2: Snapshot Scores Reference Categories by FK
**What goes wrong:** `snapshot_scores.category_id` references `categories.id`. When the user renames "Health" to "Wellness" (WHEEL-04), all historical snapshots now show "Wellness" instead of "Health" — the snapshot no longer reflects the state at the time it was saved.
**Why it happens:** Natural inclination to normalize.
**How to avoid:** Always store `category_name text NOT NULL` as a value copy in `snapshot_scores`. No FK to `categories`. This is already noted in STATE.md under "Snapshot immutability."
**Warning signs:** `snapshot_scores` has a `category_id` FK column.

### Pitfall 3: ComparisonChart Category Ordering Is Non-Deterministic
**What goes wrong:** When two snapshots have different category sets (e.g., user added a category between saves), the merged category order in the chart is different each render because it's built from a Set and Object.keys().
**Why it happens:** `Set` iteration order is insertion order, which may differ between snapshot 1 and snapshot 2 if they were saved at different times with different category sets.
**How to avoid:** Sort by `position` from snap1 (oldest), then append categories that only exist in snap2 at the end. Since `position` is captured at save time in `snapshot_scores`, this is stable and deterministic.
**Warning signs:** Radar chart looks different on two re-renders of the same data.

### Pitfall 4: hasSnapshots Race Condition in WheelPage
**What goes wrong:** `hasSnapshots` state is initialized to `false` and loaded asynchronously. If the user is on a wheel with snapshots and immediately tries to rename a category before the check resolves, no warning dialog appears.
**Why it happens:** Async state initialization.
**How to avoid:** Initialize `hasSnapshots` to `true` (pessimistic default) and load the real value asynchronously. This ensures the warning always shows until we confirm there are no snapshots. Alternatively, block the rename/remove buttons while the check is in flight. The simpler approach: since `listSnapshots` is called on SnapshotsPage mount, pass `hasSnapshots` as a prop to WheelPage from a parent context, or derive it from the snapshot count already fetched.
**Warning signs:** Rename warning never appears for a wheel that has snapshots.

### Pitfall 5: Saving a Snapshot While Categories State Is Stale
**What goes wrong:** User drags a slider (updates local React state), then immediately clicks "Save Snapshot" before the `onValueCommit` Supabase write completes. The snapshot captures the pre-drag DB values, not the visual state.
**Why it happens:** WheelPage's `localCategories` state reflects the live slider positions; `categories` from the hook reflects what the DB has persisted. The save action should use `localCategories`, not `categories`.
**How to avoid:** The "Save Snapshot" button in WheelPage must pass `localCategories` (the live React state) to `saveSnapshot`, not the hook's `categories`. This is consistent with the existing real-time chart pattern where `localCategories` is the source of truth for display.
**Warning signs:** Snapshot scores don't match what the user saw on the wheel at save time.

### Pitfall 6: Fetching All Snapshot Scores Eagerly on SnapshotsPage Load
**What goes wrong:** On mount, SnapshotsPage queries `snapshot_scores` for all snapshots. For a user with 20 snapshots × 8 categories = 160 rows loaded before the user has selected any snapshots to compare.
**Why it happens:** Over-fetching to simplify state management.
**How to avoid:** Load scores lazily — only when a snapshot is selected for comparison. Maintain a cache: `scoresCache: Record<snapshotId, SnapshotScoreRow[]>`. For the score history table (COMP-02), a single query filtered by `snapshot_ids IN (...)` after all snapshots are listed is acceptable.
**Warning signs:** Network tab shows a large `snapshot_scores` SELECT on SnapshotsPage mount.

### Pitfall 7: Saving Snapshot with 0 Categories
**What goes wrong:** A wheel in a transient state has 0 categories. Saving a snapshot produces a `snapshots` row with no corresponding `snapshot_scores`. The comparison chart renders empty.
**How to avoid:** Disable or hide the "Save Snapshot" button when `localCategories.length === 0`. Guard in the `saveSnapshot` hook function: if categories array is empty, return `{ error: 'Cannot save an empty wheel' }`.
**Warning signs:** A snapshot row exists with no related `snapshot_scores` rows.

---

## Code Examples

### Supabase — Save snapshot (two-step insert)
```typescript
// Step 1: insert snapshot header
const snapRes = await supabase
  .from('snapshots')
  .insert({ wheel_id: wheelId, user_id: userId, name: name.trim() })
  .select()

const snap = (snapRes.data as SnapshotRow[])[0]

// Step 2: insert score copies
await supabase.from('snapshot_scores').insert(
  categories.map(cat => ({
    snapshot_id: snap.id,
    user_id: userId,
    category_name: cat.name,
    position: cat.position,
    score_asis: cat.score_asis,
    score_tobe: cat.score_tobe,
  }))
)
```

### Supabase — List snapshots for a wheel
```typescript
// Source: Supabase JS docs + established project pattern
const res = await supabase
  .from('snapshots')
  .select('id, wheel_id, user_id, name, saved_at')
  .eq('wheel_id', wheelId)
  .order('saved_at', { ascending: false })
// Returns most recent first; reverse for chronological display
```

### Supabase — Check if snapshots exist (used by WheelPage hasSnapshots)
```typescript
// head: true means return only count, not rows — efficient
const res = await supabase
  .from('snapshots')
  .select('id', { count: 'exact', head: true })
  .eq('wheel_id', wheelId)
const exists = (res.count ?? 0) > 0
```

### Date formatting — consistent "15 Mar 2026" style
```typescript
// Format a saved_at timestamptz string for display
function formatSnapshotDate(savedAt: string): string {
  return new Date(savedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
// Usage: `${snapshot.name} — ${formatSnapshotDate(snapshot.saved_at)}`
// Output: "Q1 Review — 15 Mar 2026"
```

### Two-snapshot selector UI pattern
```typescript
// Maintain selectedSnapIds as a Set of 0-2 IDs
const [selectedSnapIds, setSelectedSnapIds] = useState<Set<string>>(new Set())

function toggleSnapshot(id: string) {
  setSelectedSnapIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else if (next.size < 2) {
      next.add(id)
    }
    return next
  })
}

// selectedSnapIds.size === 2 → show ComparisonChart
const [snapAId, snapBId] = Array.from(selectedSnapIds)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FK from snapshot_scores to categories | Text copy of category_name | Always best for immutable snapshots | Renames/deletes don't corrupt history |
| Single radar series | Multi-series RadarChart with N `<Radar>` elements | Recharts 1.x+ | Same API; extend existing WheelChart pattern |
| Storing display format in DB | Store raw value; format at render time | Always | Enables future date format changes without migrations |

**No deprecated approaches in scope for this phase.**

---

## Open Questions

1. **Where does "Save Snapshot" button live — WheelPage or SnapshotsPage?**
   - What we know: The requirements say the user "can save a snapshot" and "can view a chronological list." There is no explicit requirement for where the save button appears.
   - What's unclear: Should the save action be available from the wheel editing page (WheelPage) or only from the Snapshots section?
   - Recommendation: Place "Save snapshot" on WheelPage (where the user is actively looking at their scores) as well as on SnapshotsPage. WheelPage triggers the `SnapshotNameDialog`; SnapshotsPage shows the list and comparison. Both call the same `useSnapshots().saveSnapshot`.

2. **Snapshot selection UI — checkboxes vs. radio buttons vs. row click?**
   - What we know: COMP-01 requires selecting exactly two snapshots for overlay comparison.
   - What's unclear: The exact interaction pattern (checkboxes, radio buttons, click-to-select with visual highlight).
   - Recommendation: Checkboxes in the snapshot list, with a maximum of 2 selected. When 2 are selected, show the ComparisonChart below automatically. This is self-documenting and requires no "Compare" button.

3. **What to show when fewer than 2 snapshots exist?**
   - What we know: COMP-01 requires two snapshots to be selected.
   - What's unclear: Empty state copy.
   - Recommendation: If 0 snapshots: "No snapshots yet. Save your first snapshot from the wheel page." If 1 snapshot: "Save at least one more snapshot to compare." These are the only two cases requiring graceful empty states.

4. **free-tier user snapshot limits?**
   - What we know: The requirements do not mention any snapshot count limit for free-tier users in v1. The existing RLS for snapshots does not enforce a count limit.
   - What's unclear: Should free-tier users be limited to N snapshots?
   - Recommendation: No limit in Phase 4. v2 monetization (MONET-01) can revisit this. Do not add a limit that isn't in the requirements.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react 16.x (installed in Phase 1) |
| Config file | `vite.config.ts` (test section — already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SNAP-01 | saveSnapshot inserts snapshot + score rows; returns SnapshotRow | unit (mock Supabase) | `npm test -- --run src/hooks/useSnapshots.test.ts` | Wave 0 |
| SNAP-01 | SnapshotNameDialog renders name preview with today's date; calls onSave with trimmed name | unit (render) | `npm test -- --run src/components/SnapshotNameDialog.test.tsx` | Wave 0 |
| SNAP-02 | listSnapshots returns snapshots ordered by saved_at DESC | unit (mock Supabase) | `npm test -- --run src/hooks/useSnapshots.test.ts` | Wave 0 |
| SNAP-02 | SnapshotsPage renders snapshot list with name and formatted date | unit (mock hook) | `npm test -- --run src/pages/SnapshotsPage.test.tsx` | Wave 0 |
| COMP-01 | Selecting two snapshots renders ComparisonChart | unit (mock hook + render) | `npm test -- --run src/pages/SnapshotsPage.test.tsx` | Wave 0 |
| COMP-01 | ComparisonChart renders 4 Radar series when given two score arrays | unit (render) | `npm test -- --run src/components/ComparisonChart.test.tsx` | Wave 0 |
| COMP-02 | Score history table shows correct as-is/to-be per snapshot for selected category | unit (render) | `npm test -- --run src/pages/SnapshotsPage.test.tsx` | Wave 0 |
| SNAP-01/02 | hasSnapshots activates rename/remove warning in WheelPage | unit (mock checkSnapshotsExist) | `npm test -- --run src/pages/WheelPage.test.tsx` | update existing |
| DB schema + RLS | snapshot_scores row only visible to owner; INSERT blocked for other user | manual smoke | `supabase db reset && Studio RLS verification` | Manual only |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke: log in as premium@test.com, navigate to Snapshots, verify 4 seeded snapshots appear, select any two, verify comparison chart renders with two color sets, select a category, verify score history table has 4 rows

### Wave 0 Gaps
- [ ] `src/hooks/useSnapshots.test.ts` — covers SNAP-01 hook logic, SNAP-02 list ordering, `checkSnapshotsExist` return value
- [ ] `src/components/SnapshotNameDialog.test.tsx` — covers name input, date preview text, onSave callback
- [ ] `src/components/ComparisonChart.test.tsx` — covers four-series render, empty state, category merging
- [ ] `src/pages/SnapshotsPage.test.tsx` — covers snapshot list render, two-snapshot selection, ComparisonChart visibility, score history table

*(WheelPage.test.tsx already exists — update required to add `hasSnapshots` activation test)*

---

## Sources

### Primary (HIGH confidence)
- `src/components/WheelChart.tsx` — canonical RadarChart pattern in this codebase; ComparisonChart extends this directly
- `src/hooks/useActionItems.ts` — canonical stateless hook pattern; `useSnapshots` mirrors this structure
- `src/types/database.ts` — existing type conventions; SnapshotRow and SnapshotScoreRow follow the same shape
- `supabase/migrations/20260314000001_wheel_schema.sql` — established RLS pattern (USING + WITH CHECK on UPDATE, SELECT/INSERT/DELETE ownership policies)
- `supabase/seed.sql` — deterministic UUID convention; snapshot UUIDs follow the 0x0101–0x0104 pattern
- `src/pages/WheelPage.tsx` — confirms `hasSnapshots = false` is at line 113; exact location to update
- https://recharts.github.io/en-US/api/Radar/ — Radar component dataKey, stroke, fill, fillOpacity props; confirmed four `<Radar>` elements on one `<RadarChart>` is the supported pattern
- https://supabase.com/docs/reference/javascript/select — `{ count: 'exact', head: true }` option for efficient existence check
- https://ui.shadcn.com/docs/components/dialog — Dialog component API (already installed, no new install needed)

### Secondary (MEDIUM confidence)
- STATE.md accumulated decisions — "Snapshot immutability: snapshot_scores stores value copies, not FK to categories" (project decision, already made)
- STATE.md — "hasSnapshots hardcoded to false in Phase 2 — snapshots table and real check introduced in Phase 4" (confirms the activation work required)

### Tertiary (LOW confidence)
- None — all Phase 4 findings are directly verifiable from the existing codebase or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new npm packages; all libraries already in use with established patterns
- Architecture: HIGH — directly derived from existing codebase hooks and RLS patterns; snapshot schema immutability is a documented project decision
- Database schema: HIGH — follows the same RLS template as Phase 2 and Phase 3; immutability design is a project constraint already established
- Pitfalls: HIGH — most pitfalls derived from existing codebase patterns (hasSnapshots race, localCategories vs. categories save discrepancy) or from data modeling first principles (text copy vs. FK)
- Seed data: HIGH — uses deterministic UUIDs following established Phase 2 convention; score story already documented in seed.sql comments

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days — Recharts 3.x API is stable; Supabase RLS behavior is stable; shadcn Dialog API is stable)
