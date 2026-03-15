---
created: 2026-03-15T10:48:40.635Z
title: In-app feature request submission
area: ui
files:
  - src/components/
---

## Problem

Users have no way to submit feature requests from within the application. Feedback is currently lost unless the user contacts the founder directly.

## Solution

- Add a "Request a feature" button/link in the UI (e.g. in the nav or a footer)
- Simple form: feature title + description, submitted by authenticated user
- Options: store in a `feature_requests` Supabase table (with user_id, text, created_at), or integrate with an external tool (e.g. email via Supabase Edge Function, or a link to a Typeform/Canny)
- Decision needed: self-hosted table vs. external service
