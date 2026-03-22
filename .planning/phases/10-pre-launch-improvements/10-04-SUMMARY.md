---
plan: "10-04"
phase: "10-pre-launch-improvements"
status: complete
completed: 2026-03-22
---

## Summary

Added legal footer (Terms / Privacy links) to Sidebar, visible on every authenticated page.

## What Was Built

- Added Terms and Privacy `NavLink` elements pinned at the bottom of `Sidebar.tsx`
- Links styled as subdued text consistent with sidebar aesthetics
- 2 passing tests in `Sidebar.test.tsx` verifying both links render with correct hrefs

## Self-Check

- [x] Sidebar renders Terms link → `/terms` ✓
- [x] Sidebar renders Privacy link → `/privacy` ✓
- [x] `npm test -- --run src/components/Sidebar.test.tsx` passes ✓
- [x] `npm run build` passes ✓

## Key Files

### Modified
- `src/components/Sidebar.tsx` — legal footer with Terms/Privacy NavLinks
- `src/components/Sidebar.test.tsx` — 2 passing tests for footer links
