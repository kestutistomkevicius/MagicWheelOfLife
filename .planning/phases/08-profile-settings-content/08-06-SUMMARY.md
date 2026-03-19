---
phase: 08-profile-settings-content
plan: "06"
subsystem: legal-content
tags: [terms, privacy, gdpr, legal, content]
dependency_graph:
  requires: [08-01]
  provides: [CONTENT-01, CONTENT-02]
  affects: []
tech_stack:
  added: []
  patterns: [inline-legal-content, prose-layout]
key_files:
  created:
    - src/pages/TermsPage.test.tsx
    - src/pages/PrivacyPage.test.tsx
  modified:
    - src/pages/TermsPage.tsx
    - src/pages/PrivacyPage.tsx
decisions:
  - "Inline legal text (not external legal service) — consistent with RESEARCH.md recommendation"
  - "max-w-3xl prose layout with h2 sections — readable without Tailwind prose plugin dependency"
metrics:
  duration: 104s
  completed: "2026-03-19"
  tasks_completed: 2
  files_changed: 4
---

# Phase 8 Plan 06: Legal Content Pages Summary

Full Terms of Service and Privacy Policy pages replacing "Coming soon" stubs — app is legally ready for users before launch prep in Phase 10.

## What Was Built

**TermsPage.tsx** — 11-section Terms of Service covering: acceptance of terms, service description (free + premium tiers), user accounts (Supabase Auth, 16+ requirement), user content ownership, acceptable use, premium tier (Stripe coming Phase 9), service availability disclaimer, limitation of liability, governing law (Lithuania), changes to terms, and contact.

**PrivacyPage.tsx** — 10-section GDPR-aware Privacy Policy covering: introduction, data collected (account + wheel + profile + usage), data usage (no third-party sales/marketing), Supabase Cloud EU hosting, data retention and deletion, GDPR rights (access/correct/export/delete), functional-only cookies (Supabase Auth session), children (16+ only), changes policy, and contact.

Both pages:
- Layout: `max-w-3xl mx-auto py-12 px-4` with h2 section headings and readable paragraph text
- Subtitle: "Last updated: 18 March 2026"
- Footer: "← Back to home" link (plain `<a href="/">`)
- Already routed via existing App.tsx `/terms` and `/privacy` routes — no routing changes needed

**Smoke tests** created for each page:
- Confirms "Coming soon" text is absent
- Confirms at least one h2 heading is present

## Verification Results

| Check | Result |
|-------|--------|
| `npm test -- --run TermsPage` | 2/2 passed |
| `npm test -- --run PrivacyPage` | 2/2 passed |
| `npm run build` | Clean (pre-existing chunk size warning only) |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: TermsPage | e49308e | feat(08-06): full Terms of Service page with smoke tests |
| Task 2: PrivacyPage | 796dee9 | feat(08-06): full Privacy Policy page with smoke tests |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/pages/TermsPage.tsx | FOUND |
| src/pages/TermsPage.test.tsx | FOUND |
| src/pages/PrivacyPage.tsx | FOUND |
| src/pages/PrivacyPage.test.tsx | FOUND |
| Commit e49308e | FOUND |
| Commit 796dee9 | FOUND |
