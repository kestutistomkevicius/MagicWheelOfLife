---
title: "Pre-launch: verify SEC-01 browser validation (direct tier PATCH blocked)"
priority: high
created: 2026-03-24
phase: pre-launch
tags: [security, pre-launch, sec-01]
---

## What

Confirm that a signed-in free user cannot self-elevate to premium by calling
`supabase.from('profiles').update({ tier: 'premium' })` directly from the browser.

This was skipped during Phase 11 verification (DevTools issue). The DB-layer `REVOKE UPDATE`
on the `tier` column is in place, but browser-path confirmation was not done.

## How to test

1. Open the app in the browser and sign in as a free user
2. Open DevTools console and run:

```javascript
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
const sb = createClient('<SUPABASE_URL>', '<ANON_KEY>')
const { data } = await sb.auth.signInWithPassword({ email: 'free@example.com', password: 'password123' })
const result = await sb.from('profiles').update({ tier: 'premium' }).eq('id', data.user.id)
console.log(result.error)
```

3. **Expected:** `result.error` is NOT null — PostgreSQL permission denied or PostgREST 403
4. **Failure sign:** `result.error` is null (tier was updated — security gap still open)

## Context

- SEC-01 requirement: authenticated role cannot UPDATE `tier` column directly
- Migration: `supabase/migrations/20260323000001_profiles_tier_column_security.sql`
- DEC-006 fix: Phase 11-security-fix
- The legitimate path (Edge Function) was confirmed working in Phase 11
