---
created: 2026-03-15T13:09:41.268Z
title: Create terms of conditions page
area: ui
files: []
---

## Problem

The app has no Terms & Conditions (ToC) page. Required before public launch for legal coverage and user trust. Users should be able to read ToC before signing up and access it at any time from the app.

## Solution

Create a static `/terms` route (public, no auth required) with the ToC content. Link it from the sign-up flow (AuthPage) and the landing page (Phase 6). Content to be written by the founder. Implementation is a simple static page — no backend needed.
