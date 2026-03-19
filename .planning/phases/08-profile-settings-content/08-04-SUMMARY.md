---
phase: 08-profile-settings-content
plan: 04
subsystem: profile
tags: [avatar, settings, tier, dev-toggle, tdd]
dependency_graph:
  requires: [08-01, 08-02, 08-03]
  provides: [SettingsPage, AvatarUpload]
  affects: []
tech_stack:
  added: []
  patterns: [presentational-component, tdd-red-green, dev-env-guard]
key_files:
  created:
    - src/components/AvatarUpload.tsx
    - src/components/AvatarUpload.test.tsx
  modified:
    - src/pages/SettingsPage.tsx
    - src/pages/SettingsPage.test.tsx
decisions:
  - AvatarUpload is purely presentational — file size validation and onUpload callback only, actual upload logic stays in useProfile
  - Button inside label with aria-label enables both test accessibility (getByRole/getByLabelText) and standard file picker UX
  - import.meta.env.DEV guard evaluated at render time — tests override via assignment, works in jsdom
key_decisions:
  - AvatarUpload is purely presentational; file size guard is client-side convenience only (useProfile also guards)
metrics:
  duration: 160s
  completed: 2026-03-19
  tasks_completed: 2
  files_created: 2
  files_modified: 2
requirements:
  - PROFILE-01
  - PROFILE-02
---

# Phase 08 Plan 04: SettingsPage with Avatar Management Summary

**One-liner:** AvatarUpload widget (file input + circular preview + 2MB client guard) wired into full SettingsPage with tier badge and dev-only tier toggle.

## Tasks Completed

| # | Task | Commit | Outcome |
|---|------|--------|---------|
| 1 | AvatarUpload component with unit tests | 73c4dc4 | 5/5 tests green |
| 2 | SettingsPage full implementation | f070b61 | 5/5 tests green |

## What Was Built

### AvatarUpload component (`src/components/AvatarUpload.tsx`)

Presentational widget with:
- Circular avatar preview — renders `<img>` when `currentAvatarUrl` is set, Camera icon placeholder otherwise
- Hidden file input (`accept="image/*"`) wrapped in a label with `aria-label="Change photo"`
- Client-side 2MB size guard — shows "File must be under 2 MB" error and does NOT call `onUpload` on oversized files
- Loading state — button shows "Uploading..." and is disabled when `loading=true`

### SettingsPage (`src/pages/SettingsPage.tsx`)

Full implementation replacing the stub:
- Uses `useAuth` for userId and `useProfile` for tier/avatar/mutations
- Avatar section — renders AvatarUpload with `updateAvatar` wired as `onUpload`
- Tier badge — "Free" (stone) or "Premium" (amber) pill
- Dev-only tier toggle — `import.meta.env.DEV` guard; button text flips between "Switch to premium" / "Switch to free"
- TODO comment for Phase 9 color scheme selector (PREMIUM-02)

## Deviations from Plan

None — plan executed exactly as written. TDD red-green cycle followed for both tasks.

## Verification

- `npm test -- --run AvatarUpload` — 5/5 tests green
- `npm test -- --run SettingsPage` — 5/5 tests green
- `npm run build` — TypeScript compiles clean, build succeeds

## Self-Check

- [x] `src/components/AvatarUpload.tsx` — created
- [x] `src/components/AvatarUpload.test.tsx` — created
- [x] `src/pages/SettingsPage.tsx` — updated (stub replaced)
- [x] `src/pages/SettingsPage.test.tsx` — updated (todos replaced with real tests)
- [x] Commits 73c4dc4 and f070b61 exist in git log

## Self-Check: PASSED
