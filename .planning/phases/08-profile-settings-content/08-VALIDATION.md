---
phase: 8
slug: profile-settings-content
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 0 | PROFILE-01 | unit stub | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-01-02 | 01 | 1 | PROFILE-01 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-02-01 | 02 | 0 | PROFILE-02 | unit stub | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-02-02 | 02 | 1 | PROFILE-02 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-03-01 | 03 | 1 | CONTENT-01 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-04-01 | 04 | 1 | CONTENT-02 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-05-01 | 05 | 1 | CONTENT-03 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-06-01 | 06 | 1 | CONTENT-04 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 8-07-01 | 07 | 1 | CONTENT-05 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useProfile.test.ts` — stubs for PROFILE-01 (Plan 02 Task 1)
- [ ] `src/pages/SettingsPage.test.tsx` — stubs for PROFILE-02 (Plan 02 Task 1)
- [ ] `src/components/FeatureRequestModal.test.tsx` — stubs for CONTENT-03 (Plan 02 Task 2)
- [x] `src/components/AvatarUpload.test.tsx` — created directly in Plan 04 Task 1 (tdd, no stub needed)
- [x] `src/pages/TermsPage.test.tsx` — created directly in Plan 06 Task 1 (smoke tests, no stub needed)
- [x] `src/pages/PrivacyPage.test.tsx` — created directly in Plan 06 Task 2 (smoke tests, no stub needed)

*Existing infrastructure (vitest) covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar image uploads and displays in app shell | PROFILE-01 | File upload via Supabase Storage requires real browser + network | Sign in, go to Settings, upload a photo, verify it appears in nav |
| Terms & Privacy legal text renders correctly | CONTENT-01 | Content review — no automated test for legal completeness | Navigate to /terms and /privacy, read through the content |
| Feature request form submits and stores in DB | CONTENT-02 | Requires real Supabase connection | Submit a feature request, verify row in Studio feature_requests table |
| Dev tier toggle only visible in dev mode | PROFILE-02 | NODE_ENV conditionals don't apply in test env | Open app in dev mode, verify toggle visible; verify it's absent in prod build |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
