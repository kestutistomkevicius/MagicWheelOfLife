---
created: 2026-03-19T00:00:00.000Z
title: Admin role — feature requests page and email notifications
area: admin
files:
  - src/pages/AdminFeatureRequestsPage.tsx
  - supabase/migrations/
---

## Problem

Feature requests are stored in the `feature_requests` table but there is no way for the admin/founder to view or manage them from within the app. There is also no notification when a new request is submitted.

## Solution

- Add an `admin` role to the user model (RLS-protected, only the founder's account)
- Create an **Admin: Feature Requests** page listing all submissions (user email, text, timestamp)
- Trigger a Supabase Edge Function on INSERT to `feature_requests` that sends an email to the admin's configured email address
- Admin navigation item only visible when user has the admin role

## Notes

- Admin email should be configurable (env var or Supabase config)
- Edge Function can use Supabase's built-in SMTP or Resend/SendGrid
