---
phase: 09-ai-and-premium
plan: "03"
subsystem: ai-coach-edge-function
tags: [edge-function, anthropic, streaming, jwt-auth, premium-gate]
dependency_graph:
  requires: [09-02]
  provides: [ai-coach-edge-function]
  affects: [supabase/functions/ai-coach/index.ts]
tech_stack:
  added: [npm:@anthropic-ai/sdk, Deno Edge Runtime]
  patterns: [Anthropic streaming via ReadableStream, JWT validation via supabase.auth.getUser, sentinel JSON in stream]
key_files:
  created: [supabase/functions/ai-coach/index.ts]
  modified: []
key_decisions:
  - "Edge Function uses npm:@anthropic-ai/sdk imported at deploy time — no package.json needed in Deno runtime"
  - "Model defaults to claude-haiku-4-5-20251001 if ANTHROPIC_MODEL secret not set — env fallback pattern"
  - "Streaming error encoded inline as text chunk — keeps stream from hanging on Anthropic errors"
  - "CORS preflight returns null body (not empty string) — matches RFC spec for 200 OPTIONS response"
metrics:
  duration: "216s"
  completed: "2026-03-20"
  tasks_completed: 1
  files_changed: 1
---

# Phase 9 Plan 03: AI Coach Edge Function Summary

Deno Edge Function proxying requests from the browser to Anthropic API, keeping the API key server-side, validating JWTs, enforcing premium tier, and streaming tokens back to the caller.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Implement ai-coach Edge Function | 972a4ce | supabase/functions/ai-coach/index.ts |

## What Was Built

`supabase/functions/ai-coach/index.ts` is the AI track's core server-side component. It:

1. Handles CORS preflight (OPTIONS) returning 200 with `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Headers`
2. Validates the JWT from `Authorization: Bearer <token>` via `supabase.auth.getUser(token)` — returns 401 if missing or invalid
3. Queries the `profiles` table for `tier` — returns 403 if tier is not `'premium'`
4. Parses the POST body (`categoryName`, `asisScore`, `tobeScore`, `messages[]`)
5. Builds a reflective life-coach system prompt that instructs the AI to ask 2-4 questions before suggesting scores, and to embed the sentinel `{"type":"score_proposal","asis":X,"tobe":Y}` on its own line when ready
6. Calls `anthropic.messages.create({ stream: true, ... })` and pipes `content_block_delta` / `text_delta` events to a `ReadableStream`
7. Returns `text/plain; charset=utf-8` with CORS headers and `Transfer-Encoding: chunked`

## Deviations from Plan

None - plan executed exactly as written.

## Environment Setup Required

Before serving the function locally:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
npx supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

Serve locally:
```bash
npx supabase functions serve ai-coach --no-verify-jwt
```

## Self-Check: PASSED

- FOUND: supabase/functions/ai-coach/index.ts
- FOUND: commit 972a4ce
