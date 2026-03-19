# Phase 8: Profile, Settings & Content - Research

**Researched:** 2026-03-18
**Domain:** User profile (avatar upload via Supabase Storage), app settings page, legal content, in-app feature requests, snapshot onboarding UX, multi-wheel TrendPage selector
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROFILE-01 | User can upload or select an avatar/photo that appears near the sign-out button in the app shell | Supabase Storage bucket for avatars; `storage.from('avatars').upload()` + `getPublicUrl()`; Sidebar user section already has avatar placeholder div |
| PROFILE-02 | Settings page is complete: color scheme selector, avatar management, current tier display, and a dev-only tier toggle for testing | SettingsPage.tsx is a stub; profiles table has `tier` column; color scheme deferred to Phase 9 (PREMIUM-02); dev toggle updates `profiles.tier` directly (RLS allows row-owner updates) |
| CONTENT-01 | Terms of Service page has full legal content replacing the "coming soon" stub | TermsPage.tsx is a stub; SaaS-appropriate legal text needed |
| CONTENT-02 | Privacy Policy page has full legal content replacing the "coming soon" stub | PrivacyPage.tsx is a stub; data-model known (email, wheel data, Supabase hosting) |
| CONTENT-03 | In-app feature request form is accessible from the nav; submissions are persisted or forwarded | New `feature_requests` table in Supabase; or Supabase Edge Function to forward email; nav entry in Sidebar |
| CONTENT-04 | A new user encounters a clear explanation of what a snapshot is and why to use it before or during their first snapshot save | First-save detection via `checkSnapshotsExist`; SnapshotNameDialog is the trigger point; one-time modal or inline callout |
| CONTENT-05 | Premium users can select which wheel to view trends for via a dropdown on TrendPage; seed data includes snapshots for multiple wheels | TrendPage already has `wheels.length > 1` guard and `selectWheel` wired; wheel selector already renders (lines 120–131 in TrendPage.tsx); seed needs a second wheel with 3+ snapshots for premium user |
</phase_requirements>

---

## Summary

Phase 8 has seven requirements across three clusters: (1) user profile with avatar and a completed settings page, (2) legal and community content (Terms, Privacy, feature requests), and (3) premium wheel/snapshot UX polish (snapshot onboarding tooltip and multi-wheel trend selector).

Most of the wiring already exists. The TrendPage wheel selector is already rendered (lines 120–131 of TrendPage.tsx) — CONTENT-05 primarily requires seed data changes and a test. The Sidebar already renders an avatar placeholder div. The biggest net-new work is Supabase Storage integration for avatar uploads, a proper SettingsPage component, full legal text for Terms/Privacy, a feature request mechanism, and the snapshot onboarding tooltip.

The dev-only tier toggle (part of PROFILE-02) must write to `profiles.tier` — this is already allowed by the existing RLS UPDATE policy. The color scheme selector is explicitly moved to Phase 9 (PREMIUM-02), so PROFILE-02 scope is: avatar, tier display, dev toggle only.

**Primary recommendation:** Lead with the DB/storage migration wave (avatar bucket, feature_requests table, seed second wheel), then implement SettingsPage, then Sidebar avatar display, then the content pages, then the snapshot onboarding UX.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.49.4 (already installed) | Storage upload/download, DB writes | Project standard; Storage API is part of the same client |
| React + TypeScript + Tailwind | already installed | All new UI components | Project standard |
| shadcn/ui (manual) | existing components | Dialog, Button, Input, Label reuse | Established pattern — no CLI |
| lucide-react | ^0.487.0 (already installed) | Icons for feature request nav, settings | Project standard |
| Vitest + Testing Library | already installed | Unit tests | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI primitives (manual) | via existing shadcn installs | Tooltip for snapshot onboarding callout | Already used; add `@radix-ui/react-tooltip` if needed for onboarding tooltip |
| No new npm installs required | - | All capability exists in current deps | Avatar upload, DB writes, modals all covered |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage for avatars | External image hosting / URL input only | Storage gives upload UX; URL-only is simpler but worse UX; Storage is already enabled in config.toml |
| `feature_requests` DB table | Supabase Edge Function + email | Table is simpler, no email config needed for dev; email forwarding is v2 enhancement |
| Full custom Terms/Privacy text | Link to external legal service | External services cost money and add dependency; inline text is the right MVP approach |

**Installation:** No new packages required. All dependencies are present.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── AvatarUpload.tsx       # Upload widget used in SettingsPage and Sidebar
│   └── SnapshotOnboardingTip.tsx  # Callout shown on first save
├── hooks/
│   └── useProfile.ts          # Avatar URL, tier, updateAvatar, updateTier (dev-only)
├── pages/
│   ├── SettingsPage.tsx       # Full implementation (replaces stub)
│   ├── TermsPage.tsx          # Full legal content (replaces stub)
│   └── PrivacyPage.tsx        # Full legal content (replaces stub)
└── ...
```

### Pattern 1: Supabase Storage for Avatar Upload

**What:** Upload image to a public `avatars` bucket, store the resulting public URL in `profiles.avatar_url`. Display in Sidebar.

**When to use:** PROFILE-01 and PROFILE-02.

**Migration required:**
```sql
-- Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Storage bucket creation is done via Supabase Studio or seed SQL
-- Not possible via migration SQL directly — use supabase/seed.sql or storage config
```

**Storage bucket setup (in seed or via Studio):**
```sql
-- Run via seed.sql or Studio SQL editor (requires storage schema access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars: authenticated update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Upload pattern:**
```typescript
// Source: Supabase Storage JS docs
const filePath = `${userId}/${Date.now()}.${ext}`
const { error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, { upsert: true })

const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath)
// data.publicUrl is the avatar URL to store in profiles.avatar_url
```

**Persist URL:**
```typescript
await supabase
  .from('profiles')
  .update({ avatar_url: data.publicUrl })
  .eq('id', userId)
```

**Sidebar display (replace letter-initial div):**
```tsx
// In Sidebar.tsx — conditionally show avatar image or initial fallback
{avatarUrl ? (
  <img src={avatarUrl} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
) : (
  <div className="flex h-7 w-7 ...">
    {initial}
  </div>
)}
```

### Pattern 2: useProfile Hook

**What:** Central hook owning profile data (tier, avatar_url). Consumed by SettingsPage and Sidebar.

**When to use:** Anywhere profile data is needed.

```typescript
// Signature pattern consistent with existing hooks
export interface UseProfileResult {
  tier: 'free' | 'premium'
  avatarUrl: string | null
  loading: boolean
  updateAvatar: (file: File) => Promise<void>
  updateTier: (newTier: 'free' | 'premium') => Promise<void>  // dev-only
}
```

**Note:** `useWheel` already fetches tier from `profiles`. To avoid double-fetching, `useProfile` can be a lightweight hook that fetches `avatar_url` (and `tier` for display). Alternatively, extend `useWheel`'s profile fetch to also return `avatar_url`. The separate hook approach is cleaner — SettingsPage and Sidebar consume it independently of wheel data.

### Pattern 3: Dev-Only Tier Toggle

**What:** A toggle in SettingsPage that writes to `profiles.tier`. Only visible when `import.meta.env.DEV` is true.

**When to use:** PROFILE-02 — allows testing premium features without Stripe.

```typescript
// Guard in SettingsPage:
{import.meta.env.DEV && (
  <div className="border border-amber-300 rounded p-4 bg-amber-50">
    <p className="text-xs text-amber-700 mb-2">Dev only — not shown in production</p>
    <button onClick={() => updateTier(tier === 'free' ? 'premium' : 'free')}>
      Switch to {tier === 'free' ? 'premium' : 'free'}
    </button>
  </div>
)}
```

**Note from DEC-006 in STATE.md:** `profiles.tier` is writable by the row-owner via RLS. The decision comment says "must enforce tier server-side or move to service-role-only table before Phase 7 launch." Phase 8 uses this dev toggle explicitly, and Phase 9 will introduce the proper premium flow. The dev toggle is acceptable for dev env only — production launch is Phase 10 where this will be addressed.

### Pattern 4: Feature Request Storage

**What:** New `feature_requests` table. Nav link in Sidebar opens a modal or navigates to a `/feedback` page. Free-text + optional email.

**When to use:** CONTENT-03.

```sql
CREATE TABLE public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  text text NOT NULL CHECK (char_length(text) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_requests: insert authenticated" ON public.feature_requests
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- No SELECT policy for users — founder reads via service role / Studio
```

**UI approach:** Modal accessible from a nav icon (e.g., MessageSquare from lucide-react), not a separate page. Keeps nav clean; consistent with existing modal patterns.

### Pattern 5: Snapshot Onboarding Tip (CONTENT-04)

**What:** When `checkSnapshotsExist` returns `false`, show an educational callout before the first snapshot save.

**When to use:** CONTENT-04 — new user's first encounter with snapshot UX.

**Implementation options:**
1. **Inline callout on SnapshotsPage** — a banner above the "Save snapshot" button explaining what snapshots are. Shown only when `snapshots.length === 0`. Simplest option, no new component needed.
2. **One-time info dialog before SnapshotNameDialog** — intercept the "Save snapshot" click, show an info dialog first, then proceed to naming. More prominent but more code.

**Recommended:** Option 1 — inline callout on SnapshotsPage when snapshot count is 0. This is the least disruptive, uses the existing `hasSnapshotCount === 0` state already available on the page, and can reuse the existing empty state pattern.

```tsx
{snapshots.length === 0 && (
  <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
    <p className="font-medium">What is a snapshot?</p>
    <p className="mt-1 text-stone-600">
      A snapshot is a saved copy of your current wheel scores. Take one now to
      capture where you stand today — you'll be able to compare it with future
      snapshots to see how you've grown.
    </p>
  </div>
)}
```

### Pattern 6: Multi-Wheel TrendPage (CONTENT-05)

**What:** TrendPage already renders a wheel selector when `wheels.length > 1` (lines 120–131 of TrendPage.tsx). The requirement is already implemented in the UI. What's missing is seed data — the premium user needs a second wheel with 3+ snapshots.

**When to use:** CONTENT-05.

**Seed addition needed:**
```sql
-- In seed.sql: add second wheel for premium_user_id with 3+ snapshots
-- Wheel: 'Work & Purpose' with categories Career, Finance, etc.
-- 3 snapshots at different dates so trend chart works
```

**Note:** The `selectWheel` function in `useWheel` already loads categories for the selected wheel. The TrendPage `useEffect` already depends on `wheel?.id`. No hook changes needed — only seed data and test coverage.

### Anti-Patterns to Avoid

- **Don't create a separate `/profile` route** — Settings page covers both avatar and profile data. Keep nav simple.
- **Don't install `@radix-ui/react-tooltip` unless needed** — If the snapshot onboarding tip is an inline div (Pattern 5 option 1), no tooltip primitive is needed.
- **Don't write `avatar_url` as a data-URL** — Store the Supabase Storage public URL, not a base64 blob. Data-URLs in a DB column cause large row sizes and slow queries.
- **Don't use the shadcn CLI** — Established project pattern; create components manually. tsconfig.app.json alias incompatibility remains.
- **Don't add a `color_scheme` column to profiles in Phase 8** — PREMIUM-02 is Phase 9. Don't pre-build the column.
- **Don't add a SELECT policy to `feature_requests` for users** — Founders should read via Studio/service role only. User-facing SELECT is not needed and adds surface area.
- **Don't file-size-gate at component level only** — Also validate in Storage upload policy (covered by `file_size_limit = "50MiB"` in config.toml, but add a client-side 2MB check for UX).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload to object store | Custom S3 integration | Supabase Storage (`supabase.storage.from().upload()`) | Already included in the project's Supabase setup; storage is enabled in config.toml |
| Image resize/transform | Canvas API manipulation | Supabase Storage image transformations (already enabled: `[storage.image_transformation] enabled = true`) | Built-in; request transformed URL with `?width=56&height=56` query params |
| Avatar display fallback | Complex CSS tricks | `<img>` with `onError` fallback to initials div | Simple, accessible, idiomatic |
| Legal text validation | Custom content review | Use a standard SaaS ToS/Privacy template and adapt | Legal text is boilerplate for this app type; the data model is fully known |

**Key insight:** Supabase Storage is already running locally (config.toml `[storage] enabled = true`) — no additional infrastructure needed. The SDK is already installed.

---

## Common Pitfalls

### Pitfall 1: Storage RLS Policies Not Applied
**What goes wrong:** Uploading to storage succeeds in Studio (service role bypasses RLS) but fails in the browser (authenticated role blocked).
**Why it happens:** Storage buckets require explicit `INSERT` policies on `storage.objects` — just making a bucket public doesn't allow uploads.
**How to avoid:** Always create both a public `SELECT` policy and an owner-scoped `INSERT` policy. Use `storage.foldername(name)[1]` to scope to `auth.uid()::text`.
**Warning signs:** `Error: new row violates row-level security policy` on upload.

### Pitfall 2: avatar_url Not in profiles SELECT Query
**What goes wrong:** `useWheel` fetches `profiles` with `select('id, tier, created_at')` — `avatar_url` will be `undefined` even after adding the column.
**Why it happens:** Explicit column select in existing fetch — won't auto-include new columns.
**How to avoid:** Either extend the `useWheel` profile fetch to include `avatar_url`, OR use the separate `useProfile` hook pattern which fetches `avatar_url` independently.
**Warning signs:** Avatar URL is always null despite successful upload.

### Pitfall 3: Dev Tier Toggle Persists Across db reset
**What goes wrong:** Developer switches to premium in UI, forgets, resets DB, then tier is back to free — but `useWheel`'s cached state shows premium until page reload.
**Why it happens:** Optimistic state in `useWheel` is not cleared on `supabase db reset`.
**How to avoid:** After `updateTier`, call a page refresh or reload the hook (simplest: `window.location.reload()`). Dev tool; UX perfection not required.

### Pitfall 4: Sidebar Needs Profile Data But AppShell Has No Profile Context
**What goes wrong:** Sidebar needs `avatarUrl` but currently only gets `session.user.email` from `useAuth`. Adding a Supabase query inside Sidebar on every render causes N extra network calls.
**Why it happens:** AppShell/Sidebar is outside the wheel data scope.
**How to avoid:** Options:
  1. Create `useProfile(userId)` hook called once in Sidebar — acceptable since Sidebar is a singleton.
  2. Add a `ProfileContext` wrapping `AppShell` — heavier but cleaner if profile data is needed in multiple shell children.
  Recommended: `useProfile` hook called in Sidebar. Same pattern as `useWheel` called in WheelPage.

### Pitfall 5: Feature Request Form — No User Feedback on Submit
**What goes wrong:** User submits form, nothing visible happens, they submit multiple times.
**Why it happens:** Async Supabase insert without loading/success state.
**How to avoid:** Show a loading spinner on the submit button, then a "Thanks! We'll review it." success state that replaces the form. Reset form on success.

### Pitfall 6: Terms/Privacy Pages Are Outside ProtectedRoute But Use App Styles
**What goes wrong:** Terms/Privacy render correctly on the public landing page flow but look broken (wrong font, no Tailwind base) because the head `<link>` isn't loaded.
**Why it happens:** These pages ARE under App.tsx which loads Tailwind — this is not actually an issue in this project. The pages are already registered in App.tsx.
**How to avoid:** No action needed — styles are global in main.tsx. Just replace the stub content with full legal text.

### Pitfall 7: CONTENT-05 Seed — Premium User's Second Wheel Snapshots Missing
**What goes wrong:** TrendPage wheel selector only appears when `wheels.length > 1` — if the second wheel has no snapshots, the selector shows but TrendPage shows empty state.
**Why it happens:** The selector renders the wheel but there are no snapshot scores for it.
**How to avoid:** Seed the second wheel with at least 3 snapshots (required for chart). Use the same pattern as the existing premium user seed in `seed.sql`.

---

## Code Examples

Verified patterns from project codebase:

### Existing Avatar Placeholder in Sidebar (to be replaced)
```tsx
// Current: src/components/Sidebar.tsx lines 54–57
<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-white">
  {initial}
</div>
```

### Existing Profile Fetch in useWheel (extend or mirror in useProfile)
```typescript
// Current: src/hooks/useWheel.ts lines 63–76
const profileRes = await supabase
  .from('profiles')
  .select('id, tier, created_at')  // ADD avatar_url HERE when column exists
  .eq('id', userId)
  .limit(1)
```

### Existing checkSnapshotsExist Usage (hook for CONTENT-04)
```typescript
// src/hooks/useSnapshots.ts — checkSnapshotsExist returns boolean
// Already called in WheelPage. Same pattern usable in SnapshotsPage for onboarding tip.
const { checkSnapshotsExist } = useSnapshots()
const hasAny = await checkSnapshotsExist(wheel.id)
```

### Existing TrendPage Wheel Selector (already implemented — CONTENT-05 is seed + test only)
```tsx
// Current: src/pages/TrendPage.tsx lines 120–131
{wheels.length > 1 && (
  <select
    value={wheel?.id ?? ''}
    onChange={e => void selectWheel(e.target.value)}
    className="text-sm border border-stone-300 rounded px-2 py-1 ..."
  >
    {wheels.map(w => (
      <option key={w.id} value={w.id}>{w.name}</option>
    ))}
  </select>
)}
```

### ProfileRow Type (needs avatar_url addition)
```typescript
// Current: src/types/database.ts line 4–8
export type ProfileRow = {
  id: string
  tier: 'free' | 'premium'
  created_at: string
  // ADD: avatar_url: string | null
}
```

### Storage Upload (Supabase JS pattern)
```typescript
// File validation + upload
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB client-side check
if (file.size > MAX_SIZE) throw new Error('File must be under 2 MB')

const ext = file.name.split('.').pop() ?? 'jpg'
const filePath = `${userId}/avatar.${ext}`

const { error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, { upsert: true, contentType: file.type })

if (error) throw error

const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath)

await supabase
  .from('profiles')
  .update({ avatar_url: data.publicUrl })
  .eq('id', userId)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SettingsPage stub | Full SettingsPage | This phase | Unlocks user profile, dev tier toggle |
| Letter-initial avatar | Real avatar image | This phase | Personal touch, professional feel |
| "Coming soon" Terms/Privacy | Full legal content | This phase | App is legally ready for launch prep |
| No feature request mechanism | In-app form | This phase | Founder feedback loop without external tool |
| Snapshot UX has no onboarding | Inline callout for first-timers | This phase | Reduces confusion for new users |

**Already implemented (no work needed beyond seed/test):**
- CONTENT-05 TrendPage wheel selector — already rendered in TrendPage.tsx lines 120–131

---

## Open Questions

1. **Color scheme selector scope in PROFILE-02**
   - What we know: REQUIREMENTS.md PROFILE-02 says "color scheme selector" is part of Settings. PREMIUM-02 (Phase 9) is described as "color scheme personalization" for premium users.
   - What's unclear: Should PROFILE-02 include a placeholder/disabled color scheme section, or omit it entirely until Phase 9?
   - Recommendation: Omit the color scheme section entirely from Phase 8. The PROFILE-02 requirement text in REQUIREMENTS.md lists it but Phase 9 (PREMIUM-02) owns the implementation. Plan it as "avatar + tier display + dev toggle only." Add a TODO comment in SettingsPage for color scheme.

2. **Feature request forwarding to founder**
   - What we know: CONTENT-03 says "persisted or forwarded." Supabase Edge Functions can send email, but require configuration.
   - What's unclear: Does the founder want email notifications on new submissions?
   - Recommendation: Store in DB only (Phase 8). Add email forwarding via Supabase Edge Function as a v2 enhancement. The DB table gives full history; founder can check Studio. This avoids email configuration complexity in a phase that's already broad.

3. **Avatar URL storage strategy — public URL vs signed URL**
   - What we know: Public bucket with `/userId/avatar.ext` path. Public URLs don't expire. Signed URLs expire (default 1 hour).
   - What's unclear: Is there any privacy concern with a public avatar URL guessable by path?
   - Recommendation: Use public bucket + public URL. This is a self-assessment coaching app — avatars are user profile photos the user chooses to upload. No sensitive data. Public URL simplifies Sidebar display (no async signed URL fetch needed).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.1 |
| Config file | vite.config.ts (vitest config inline) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROFILE-01 | Avatar upload calls storage upload, updates profile avatar_url | unit | `npm test -- --run useProfile` | Wave 0 |
| PROFILE-01 | Sidebar renders avatar `<img>` when avatarUrl is set; falls back to initial | unit | `npm test -- --run Sidebar` | ❌ Wave 0 |
| PROFILE-02 | SettingsPage shows tier, avatar section, dev toggle in DEV mode | unit | `npm test -- --run SettingsPage` | ❌ Wave 0 |
| PROFILE-02 | Dev tier toggle calls updateTier; not rendered when DEV=false | unit | `npm test -- --run SettingsPage` | ❌ Wave 0 |
| CONTENT-03 | Feature request submit calls Supabase insert; success state shown | unit | `npm test -- --run FeatureRequestModal` | ❌ Wave 0 |
| CONTENT-04 | SnapshotsPage renders onboarding callout when snapshots.length === 0 | unit | `npm test -- --run SnapshotsPage` | ✅ exists (extend) |
| CONTENT-04 | Onboarding callout not shown when snapshots exist | unit | `npm test -- --run SnapshotsPage` | ✅ exists (extend) |
| CONTENT-05 | TrendPage wheel selector renders when wheels.length > 1 | unit | `npm test -- --run TrendPage` | ✅ exists (extend) |
| CONTENT-05 | Selecting a different wheel calls selectWheel | unit | `npm test -- --run TrendPage` | ✅ exists (extend) |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useProfile.test.ts` — covers PROFILE-01 upload and tier display
- [ ] `src/components/Sidebar.test.tsx` — ALREADY EXISTS; extend to cover avatar display (add avatar-specific tests)
- [ ] `src/pages/SettingsPage.test.tsx` — covers PROFILE-02
- [ ] `src/components/FeatureRequestModal.test.tsx` — covers CONTENT-03

*(Note: SnapshotsPage.test.tsx and TrendPage.test.tsx already exist — extend with new test cases, no new file needed)*

---

## Sources

### Primary (HIGH confidence)
- Supabase JS Storage API — upload, getPublicUrl patterns derived from project's existing `@supabase/supabase-js` ^2.49.4 usage and Supabase docs structure
- `supabase/config.toml` — Storage enabled (`[storage] enabled = true`), image transformation enabled, file_size_limit = "50MiB"
- Project source files — direct inspection of AppShell.tsx, Sidebar.tsx, TrendPage.tsx, SettingsPage.tsx, TermsPage.tsx, PrivacyPage.tsx, useWheel.ts, database.ts, seed.sql
- STATE.md — Accumulated decisions including DEC-006 (profiles.tier writable by row-owner), shadcn manual install pattern, vi.hoisted() requirement, Wave 0 stub pattern

### Secondary (MEDIUM confidence)
- Supabase Storage RLS policy patterns (storage.foldername, bucket_id checks) — standard pattern documented in Supabase docs; consistent with existing RLS structure in the project
- `import.meta.env.DEV` for dev-only UI — Vite standard; confirmed available in Vite 6.3.1 (project's version)

### Tertiary (LOW confidence)
- Legal text content for Terms/Privacy — will be authored fresh based on the known data model; no external source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required libraries already installed; Storage is already enabled
- Architecture: HIGH — patterns derived directly from existing codebase, no speculative library choices
- Pitfalls: HIGH — derived from direct inspection of existing code and STATE.md accumulated decisions
- Legal content: LOW — text must be authored; no existing source to verify against

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; Supabase JS API and Vite APIs are stable)
