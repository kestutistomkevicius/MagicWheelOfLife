---
created: 2026-03-19T00:00:00.000Z
title: Footer should appear in logged-in views
area: ui
files:
  - src/components/Layout.tsx
  - src/App.tsx
---

## Problem

The footer (with links to Terms of Service and Privacy Policy) is currently only visible on public/marketing pages. Logged-in users cannot access these legal pages from within the app.

## Solution

- Add a minimal footer to the authenticated layout (below the main content area)
- Should include: Terms | Privacy — and optionally the app version/year
- Keep it unobtrusive (small text, muted color) so it doesn't compete with the main UI
