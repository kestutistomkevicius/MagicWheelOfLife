# Architecture Research: JustAWheelOfLife

**Stack:** React + TypeScript + Tailwind + Supabase + Vite + Vercel

---

## Database Schema

### Core Tables

```sql
-- User profiles (extends Supabase auth.users)
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  tier        text NOT NULL DEFAULT 'free', -- 'free' | 'premium'
  created_at  timestamptz DEFAULT now()
)

-- Wheels (top-level container)
wheels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- Categories (the life areas on the wheel)
-- These are the LIVE categories — editable by the user
categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id    uuid NOT NULL REFERENCES wheels(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL,         -- hex color for this segment
  position    integer NOT NULL,      -- order (1–12)
  asis_score  integer,               -- 1–10, nullable (not yet scored)
  tobe_score  integer,               -- 1–10, nullable
  created_at  timestamptz DEFAULT now()
)

-- Action items (per category)
action_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  text         text NOT NULL,
  deadline     date,                  -- optional
  completed    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
)

-- Snapshots (named point-in-time captures)
snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id    uuid NOT NULL REFERENCES wheels(id) ON DELETE CASCADE,
  name        text NOT NULL,          -- user-provided name ("Q1 review")
  created_at  timestamptz DEFAULT now()
)

-- Snapshot scores (immutable copy of scores at snapshot time)
-- CRITICAL: snapshot_scores copies values, not references
-- This ensures historical data never changes when categories are edited
snapshot_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  category_name   text NOT NULL,      -- copied at save time, not FK!
  category_color  text NOT NULL,      -- copied at save time
  asis_score      integer,
  tobe_score      integer,
  position        integer NOT NULL
)
```

### RLS Policies (all tables)

```sql
-- Wheels: users own their own wheels
ALTER TABLE wheels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own wheels" ON wheels
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Same pattern for categories, action_items, snapshots, snapshot_scores
-- (through wheel_id → user_id join or direct user_id column)

-- Profiles: users can read/update own profile only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own profile" ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

**Critical:** All user_id and profile_id columns must have `CREATE INDEX ON table(user_id)` — RLS policy scans on unindexed columns cause full table scans.

### Free Tier Enforcement

```sql
-- DB-level constraint: free users can't insert a 2nd wheel
-- Enforced via CHECK in RLS policy + application logic
CREATE POLICY "Free tier wheel limit" ON wheels
  FOR INSERT WITH CHECK (
    (SELECT tier FROM profiles WHERE id = auth.uid()) = 'premium'
    OR
    (SELECT COUNT(*) FROM wheels WHERE user_id = auth.uid()) < 1
  );
```

---

## Snapshot Immutability Pattern

**Problem:** If a user edits category names after saving a snapshot, historical comparisons break.

**Solution:** `snapshot_scores` stores a **value copy** at save time, not a FK to `categories`.

```
Save Snapshot flow:
1. User clicks "Save Snapshot"
2. App prompts for snapshot name
3. INSERT INTO snapshots (wheel_id, name) → get snapshot_id
4. For each category in wheel:
   INSERT INTO snapshot_scores (snapshot_id, category_name, category_color, asis_score, tobe_score, position)
   -- Values copied from categories table at this moment
5. categories table is NOT modified
```

This means: snapshot data is permanently frozen. Category edits after the fact don't corrupt history.

---

## Frontend Component Hierarchy

```
App
├── AuthProvider (Supabase session context)
│   └── Router
│       ├── LandingPage (public)
│       ├── AuthPage (login/signup — redirects if already authed)
│       └── AppLayout (requires auth)
│           ├── Sidebar / Nav (wheel switcher, user menu)
│           ├── WheelPage
│           │   ├── WheelChart (RadarChart — live categories)
│           │   ├── CategoryList
│           │   │   └── CategoryRow
│           │   │       ├── ScoreSlider (as-is)
│           │   │       ├── ScoreSlider (to-be)
│           │   │       └── ActionItemList
│           │   │           └── ActionItem (checkbox + text + deadline)
│           │   └── SnapshotControls (Save Snapshot button)
│           ├── HistoryPage
│           │   ├── SnapshotList (chronological)
│           │   ├── ComparisonView
│           │   │   ├── WheelOverlay (two RadarCharts overlaid)
│           │   │   └── ScoreHistoryTable (category selector + table)
│           │   └── TrendChart
│           │       ├── AllCategoriesChart (Recharts LineChart)
│           │       └── SingleCategoryChart (Recharts LineChart)
│           └── SettingsPage (wheel name, category management)
```

---

## Data Flow

```
Supabase (PostgreSQL + RLS)
    ↕ supabase-js client (src/lib/supabase.ts)
TanStack Query (cache + sync)
    ↕ custom hooks (src/hooks/)
      useWheels()
      useCategories(wheelId)
      useActionItems(categoryId)
      useSnapshots(wheelId)
      useSnapshotScores(snapshotId)
React components (read from hooks, call mutations)
```

**Key pattern:** No direct Supabase calls in components. All DB access through hooks that wrap TanStack Query `useQuery` / `useMutation`.

---

## Build Order (Dependency Graph)

```
Phase 1: Auth + Profiles
  └─ Required for everything (RLS depends on auth.uid())

Phase 2: Wheel + Categories (core CRUD)
  └─ Requires: Auth

Phase 3: Scoring (sliders)
  └─ Requires: Categories

Phase 4: Action Items
  └─ Requires: Categories

Phase 5: Snapshots + Comparison
  └─ Requires: Scoring (need scores to snapshot)

Phase 6: Trend Chart
  └─ Requires: 3+ Snapshots (data) + Snapshots feature

Phase 7: Landing Page
  └─ Independent (no auth required)

Phase 8: Deployment
  └─ Requires: All above working locally
```

---

## Auth Session Handling in React

**Race condition to avoid:**

```typescript
// WRONG: Component assumes session exists on mount
const { data } = useWheels() // fires before auth resolves

// RIGHT: AuthProvider resolves session before rendering app
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session) // set initial state synchronously
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setSession(session)
  )
  return () => subscription.unsubscribe()
}, [])
```

Render app only after session state is known (show loading spinner otherwise).

---

## Dev Seed Data

```sql
-- seed.sql
INSERT INTO auth.users (id, email) VALUES
  ('dev-free-user-uuid', 'free@dev.local'),
  ('dev-premium-user-uuid', 'premium@dev.local');

INSERT INTO profiles VALUES
  ('dev-free-user-uuid', 'free'),
  ('dev-premium-user-uuid', 'premium');

-- Premium user gets a pre-built wheel with 4+ snapshots
-- so trend chart and comparison views can be tested immediately
```
