# Phase 9: AI & Premium - Research

**Researched:** 2026-03-19
**Domain:** Supabase Edge Functions / Anthropic Streaming / CSS Runtime Theming / Tier Gating
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**AI Chat — Panel Placement & Trigger**
- Trigger: "AI Coach" button in CategorySlider header row (next to the star icon)
- Panel: Slide-in drawer from right side of screen, overlaying WheelPage
- Drawer contents: Category name at top, chat thread middle (scrollable), proposal card pinned at bottom
- Free users: clicking "AI Coach" opens upgrade modal — same pattern as star/priority feature

**AI Chat — Conversation & Score Flow**
- Conversation style: Curious coach — AI opens knowing category name and current as-is/to-be scores
- Score suggestion: AI decides when to suggest; outputs proposal card with both as-is AND to-be
- Apply UX: Two independent buttons — "Apply to As-Is" and "Apply to To-Be"; applies immediately (no extra save)
- Score confirmation: User confirms by clicking Apply — no score saved without explicit user action
- Conversation history: Persisted to DB per user per category; messages auto-deleted after 3 months; new `ai_chat_messages` table with created_at index for cleanup
- Session resume: Reopening the drawer for the same category restores conversation thread

**AI Chat — Technical Architecture**
- API routing: Supabase Edge Function (`supabase/functions/ai-coach/`) proxies to Anthropic; API key as Supabase secret
- Auth gate: Edge Function validates Supabase JWT; only authenticated premium users can call it
- Model: Configured via Supabase secret (`ANTHROPIC_MODEL`); defaults to `claude-haiku-4-5-20251001`
- Streaming: Responses streamed token-by-token via ReadableStream; frontend renders tokens as they arrive
- Error handling: Inline error message in chat thread with Retry button that resends last user message

**AI Chat — Context Passed to Edge Function**
- Category name, current as-is score, current to-be score, full conversation history (array of `{role, content}` messages)

**Color Scheme — Scope & Palettes**
- Scope: Full theme swap — palette updates wheel chart colors AND UI accent (sidebar, buttons)
- Mechanism: CSS custom properties (`--palette-primary`, `--palette-secondary`, etc.) set on `:root` at runtime; WheelChart receives palette-derived color props
- Number of palettes: 4–5 predefined palettes; Amber is current default (no visual regression)
- Gating: Premium-only; free users see swatches with lock overlay and upgrade prompt on click

**Color Scheme — Selector UX**
- Placement: In SettingsPage, below existing Plan section (at `/* TODO Phase 9 */` comment)
- UI: Color swatch grid — circular swatches, selected swatch has ring/checkmark indicator
- Interaction: Click swatch → palette applied immediately AND persisted to DB; no Save button
- Default: Amber palette (`amber`) — current hardcoded colors become Palette 1

**Color Scheme — Storage**
- Location: `color_scheme` column (text, default `'amber'`) on the `profiles` table
- DB change: Migration to add `color_scheme` to `profiles`; `useProfile` extended to read/write it

**PREMIUM-01 — Tier Toggle Visibility**
- Current state: Dev-only toggle uses `import.meta.env.DEV`
- Required change: Also show in staging; use `VITE_SHOW_TIER_TOGGLE=true` env var; condition becomes `import.meta.env.DEV || import.meta.env.VITE_SHOW_TIER_TOGGLE === 'true'`
- Production: Toggle hidden (neither env var set in production)

### Claude's Discretion
- Exact CSS variable names and how they map to Tailwind tokens
- Specific hex values for each of the 4–5 palettes (within warm/earthy family for default; cooler tones for others)
- System prompt wording for the AI coach
- Chat message bubble styling within the drawer
- Exact shape/layout of the proposal card (must show two suggested values and two Apply buttons clearly)
- Cleanup job implementation for 3-month chat history retention (pg_cron vs scheduled Edge Function)
- Whether palette change triggers a smooth CSS transition or instant swap

### Deferred Ideas (OUT OF SCOPE)
- PREMIUM-01 staging scope — satisfied by `VITE_SHOW_TIER_TOGGLE` env var approach
- Per-wheel color palettes — per-user storage for now; per-wheel is v2
- AI chat rate limiting for free users — free users fully locked out (upgrade modal), no partial access
- AI chat on mobile — right-side drawer mobile treatment deferred to responsive polish pass
- AI suggesting action items — out of scope for Phase 9
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | User can open a per-category AI chat; the AI asks guided questions and suggests an as-is or to-be score; user confirms before any score is saved | Edge Function streaming pattern, Anthropic SDK for Deno, JWT auth gate, DB schema for chat persistence, React streaming render pattern |
| PREMIUM-01 | User can switch their tier between free and premium from Settings (dev/staging environment only); all tier-gated features respond immediately without a page reload | Existing `import.meta.env.DEV` pattern extension to `VITE_SHOW_TIER_TOGGLE`; already implemented in SettingsPage — minimal change |
| PREMIUM-02 | User can select a color scheme for their wheel from a set of predefined palettes; the wheel chart and UI accent color update immediately and persist across sessions | CSS custom properties runtime injection, profiles table migration, useProfile extension, WheelChart prop-driven colors |
</phase_requirements>

---

## Summary

Phase 9 has three distinct tracks that can be developed somewhat in parallel after their respective DB foundations are laid. The AI track is the most complex — it requires a new Supabase Edge Function written in Deno/TypeScript, a new database table, and a new UI drawer component. The color-scheme track requires a DB migration, a runtime CSS variable injection system, and wiring through the component tree. The tier-toggle track is a trivial two-line change to SettingsPage.

The critical integration points: `CategorySlider` gets an `onAiCoach` prop; `WheelPage` manages drawer open state and passes palette-derived color props down to `WheelChart`; `AppShell` or a high-level context applies palette CSS vars to `:root`; `useProfile` is extended with `colorScheme` state and `updateColorScheme` mutation. All three tracks share the same tier-gating pattern already established in Phase 7 (star/priority feature).

**Primary recommendation:** Build in four waves: (1) DB foundations (ai_chat_messages table + color_scheme column + pg_cron job), (2) AI Edge Function + streaming hook, (3) AI drawer UI + color palette system, (4) Wire-up + PREMIUM-01 toggle change. Checkpoint tests after each wave.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `npm:@anthropic-ai/sdk` | latest (via `npm:` Deno prefix) | Anthropic API client inside Edge Function | Official SDK; supports Deno via `npm:` prefix; built-in streaming with `messages.stream()` |
| Supabase Edge Runtime (Deno) | bundled with Supabase CLI | Host the `ai-coach` Edge Function | Already in project; only platform for proxying API key securely |
| `jsr:@supabase/functions-js` | via `jsr:` prefix | Edge Function type declarations | Official Supabase Edge Function types |
| `npm:@supabase/supabase-js@2` | 2.x (already installed) | Supabase client inside Edge Function for JWT validation | Same client as frontend; consistent auth pattern |
| ReadableStream / SSE | Web API (built-in) | Pipe Anthropic streaming tokens to browser | Native Deno/browser API; no additional library |
| CSS Custom Properties | native browser | Runtime palette switching without Tailwind rebuild | Only approach that works at runtime in Tailwind v3 |
| pg_cron | 1.6.4 (built into Supabase) | Schedule 3-month chat history DELETE job | Already available in Supabase Postgres; simpler than a scheduled Edge Function |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` + `@testing-library/react` | already installed | Unit tests for new hooks and components | All new hooks (useAiChat, useProfile extension) and components (AiCoachDrawer, ColorSchemePicker) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npm:@anthropic-ai/sdk` (Deno) | Raw `fetch` to Anthropic API | SDK handles SSE parsing, error types, retry — raw fetch adds complexity for no gain |
| pg_cron for cleanup | Scheduled Edge Function + pg_cron trigger | pg_cron is simpler; no cold start; runs directly in Postgres; scheduled EF adds network hop |
| CSS custom properties on `:root` | Tailwind plugin to generate CSS vars | Plugin approach requires build-time changes; runtime injection via JS is the only option for switching themes without rebuild |

**Installation (Edge Function):**
```bash
# No npm install needed — Deno imports resolved at deploy time.
# Edge Function imports use npm: and jsr: prefixes in the .ts file directly.
```

**Installation (local Supabase secrets):**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

---

## Architecture Patterns

### Recommended Project Structure (new files)
```
supabase/
├── functions/
│   └── ai-coach/
│       └── index.ts          # Edge Function — JWT gate + Anthropic streaming proxy
├── migrations/
│   ├── 20260319000001_ai_chat_messages.sql    # ai_chat_messages table + pg_cron job
│   └── 20260319000002_profiles_color_scheme.sql  # color_scheme column on profiles

src/
├── components/
│   ├── AiCoachDrawer.tsx     # Slide-in drawer, chat thread, proposal card
│   ├── AiCoachDrawer.test.tsx
│   ├── ColorSchemePicker.tsx # Swatch grid in SettingsPage
│   └── ColorSchemePicker.test.tsx
├── hooks/
│   ├── useAiChat.ts          # Manages chat state + streaming fetch to Edge Function
│   └── useAiChat.test.ts
├── contexts/
│   └── PaletteContext.tsx    # React context holding current palette + applyPalette()
└── types/
    └── database.ts           # Extended: AiChatMessageRow + color_scheme on ProfileRow
```

### Pattern 1: Supabase Edge Function with JWT Auth + Anthropic Streaming

**What:** Deno function that validates the caller's Supabase JWT, checks premium tier, then calls Anthropic with streaming and pipes tokens back to the browser.

**When to use:** Any time an API key must stay server-side and response needs to stream.

**Example (Edge Function skeleton):**
```typescript
// supabase/functions/ai-coach/index.ts
// Source: Supabase Edge Functions auth docs + Anthropic SDK streaming docs

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
)

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  // 2. JWT validation
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  // 3. Premium tier check
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  if (profile?.tier !== 'premium') {
    return new Response('Premium required', { status: 403 })
  }

  // 4. Parse request body
  const { categoryName, asisScore, tobeScore, messages } = await req.json()

  // 5. Build Anthropic messages array (system + history + new user message)
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001'

  // 6. Stream Anthropic response
  const stream = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    stream: true,
    system: buildSystemPrompt(categoryName, asisScore, tobeScore),
    messages,
  })

  // 7. Pipe tokens to browser via ReadableStream (SSE-style)
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Transfer-Encoding': 'chunked',
    },
  })
})

function buildSystemPrompt(category: string, asis: number, tobe: number): string {
  return `You are a thoughtful life coach helping a user reflect on their "${category}" life area.
Their current self-assessment: As-Is score ${asis}/10, To-Be (goal) score ${tobe}/10.
Ask 2-4 reflective questions to understand their situation better.
When you have enough context, output a JSON proposal block in this EXACT format on its own line:
{"type":"score_proposal","asis":X,"tobe":Y}
where X and Y are integers 1-10 based on what they've shared.
Never suggest a score before asking at least one question.
Keep responses concise (2-3 sentences max per turn).`
}
```

**Key insight on streaming proposal detection:** The frontend reads the stream and watches for the JSON `{"type":"score_proposal",...}` line. Everything else renders as chat text. This avoids a separate endpoint for the proposal.

### Pattern 2: Frontend Streaming Hook (`useAiChat`)

**What:** Custom React hook that manages the chat message array, calls the Edge Function with `fetch()`, reads the `ReadableStream` body, and appends tokens incrementally to the last assistant message.

**When to use:** Anytime you need to consume a streaming text response and render progressively.

**Example:**
```typescript
// src/hooks/useAiChat.ts
async function sendMessage(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...messages, userMsg]
  setMessages(nextMessages)
  setStreaming(true)
  setError(null)

  // Persist user message to DB
  await persistMessage(categoryId, 'user', userText)

  // Append empty assistant placeholder
  setMessages(prev => [...prev, { role: 'assistant', content: '' }])

  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token ?? ''

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryName, asisScore, tobeScore, messages: nextMessages }),
  })

  if (!res.ok || !res.body) {
    setError('AI response failed')
    setStreaming(false)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    accumulated += chunk

    // Update last message in place (streaming)
    setMessages(prev => {
      const copy = [...prev]
      copy[copy.length - 1] = { role: 'assistant', content: accumulated }
      return copy
    })
  }

  // Persist final assistant message to DB
  await persistMessage(categoryId, 'assistant', accumulated)
  // Parse proposal if present
  detectAndSetProposal(accumulated)
  setStreaming(false)
}
```

### Pattern 3: CSS Custom Properties for Runtime Palette Switching

**What:** Define palette tokens as CSS custom properties on `:root` via JavaScript at startup and on palette change. Tailwind v3 `tailwind.config.ts` references these variables where needed.

**When to use:** Any runtime theme that cannot be known at build time.

**Mechanism (two parts):**

Part A — Tailwind config references CSS vars for palette-sensitive tokens:
```typescript
// tailwind.config.ts additions (Claude's discretion section)
colors: {
  // ... existing tokens ...
  palette: {
    primary:   'var(--palette-primary)',     // wheel As-Is fill
    secondary: 'var(--palette-secondary)',   // wheel To-Be fill
    accent:    'var(--palette-accent)',      // sidebar bg, buttons
    important: 'var(--palette-important)',   // important category fill
    highlight: 'var(--palette-highlight)',   // highlighted category fill
  },
}
```

Part B — Apply palette to DOM at runtime (called at app boot and on swatch click):
```typescript
// src/contexts/PaletteContext.tsx
const PALETTES: Record<string, Record<string, string>> = {
  amber: {
    '--palette-primary':   '#e8a23a',  // current WheelChart As-Is
    '--palette-secondary': '#60a5fa',  // current WheelChart To-Be
    '--palette-accent':    '#292524',  // current sidebar (surface-sidebar)
    '--palette-important': '#b45309',  // current important radar fill
    '--palette-highlight': '#fbbf24',  // current highlight fill
  },
  ocean: {
    '--palette-primary':   '#0ea5e9',
    '--palette-secondary': '#6366f1',
    '--palette-accent':    '#0c4a6e',
    '--palette-important': '#0369a1',
    '--palette-highlight': '#38bdf8',
  },
  forest: {
    '--palette-primary':   '#22c55e',
    '--palette-secondary': '#a3e635',
    '--palette-accent':    '#14532d',
    '--palette-important': '#15803d',
    '--palette-highlight': '#4ade80',
  },
  rose: {
    '--palette-primary':   '#f43f5e',
    '--palette-secondary': '#fb923c',
    '--palette-accent':    '#4c0519',
    '--palette-important': '#be123c',
    '--palette-highlight': '#fb7185',
  },
}

export function applyPalette(name: string) {
  const vars = PALETTES[name] ?? PALETTES.amber
  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
```

**Key constraint:** `WheelChart.tsx` currently hardcodes hex strings (`#e8a23a`, `#60a5fa`, `#b45309`, `#fbbf24`). These must become props (`primaryColor`, `secondaryColor`, etc.) driven from palette context. The Recharts `Radar` component does not read CSS variables from `stroke`/`fill` — values must be passed as JavaScript strings. The sidebar background (`surface-sidebar: '#292524'`) is a Tailwind token — the palette system controls it via `--palette-accent` used in `Sidebar.tsx` as an inline style or a dynamic class.

### Pattern 4: Proposal Card Detection (Inline JSON Sentinel)

**What:** The Edge Function embeds a sentinel JSON object `{"type":"score_proposal","asis":X,"tobe":Y}` in the stream. The frontend parses this out of the accumulated text after streaming completes.

**When to use:** When you want a single streaming channel to carry both narrative text and structured data without a separate polling endpoint.

**Example:**
```typescript
function detectAndSetProposal(text: string) {
  const match = text.match(/\{"type":"score_proposal","asis":(\d+),"tobe":(\d+)\}/)
  if (match) {
    setProposal({ asis: parseInt(match[1]), tobe: parseInt(match[2]) })
    // Also strip the sentinel from the displayed text
    setDisplayText(text.replace(match[0], '').trim())
  }
}
```

### Anti-Patterns to Avoid

- **Calling Anthropic from the browser directly:** Exposes the API key in the network tab. All Anthropic calls MUST go through the Edge Function.
- **Saving the score immediately when AI suggests it:** The requirement is explicit — user must press "Apply" first. Never auto-apply.
- **Hardcoding hex values in WheelChart after Phase 9:** WheelChart must accept color props so PaletteContext can drive them.
- **Using `document.body.style` for CSS vars instead of `document.documentElement.style`:** Tailwind's `:root` selectors target `<html>`, not `<body>`.
- **Storing full conversation in Edge Function request beyond what's needed:** Pass only the messages array; the Edge Function must not persist anything — persistence is frontend's job after receiving the response.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE / streaming response | Custom event loop | `ReadableStream` with `getReader()` on the fetch body | Browser's native streaming API; works in all modern browsers |
| JWT parsing/validation in Edge Function | Manual JOSE decode | `supabase.auth.getUser(token)` with the anon-key client | Supabase handles signature verification against the project's JWT secret |
| Anthropic API retry logic | Manual exponential backoff | `npm:@anthropic-ai/sdk` (has built-in retry) | SDK handles 529 overload errors and network retries |
| Old chat message cleanup | Manual vacuum job | pg_cron with `SELECT cron.schedule(...)` in migration | pg_cron runs inside Postgres; no cold start; no external cron service |

**Key insight:** The streaming architecture is straightforward because the browser's `fetch()` `ReadableStream` directly supports chunked responses — no WebSockets, no special library, no SSE parsing library needed.

---

## Common Pitfalls

### Pitfall 1: CORS Errors on Edge Function Calls
**What goes wrong:** Browser blocks the fetch to the Edge Function with a CORS error.
**Why it happens:** Supabase Edge Functions need explicit CORS headers; they don't add them automatically.
**How to avoid:** Handle `OPTIONS` preflight in `Deno.serve` and add `Access-Control-Allow-Origin: *` (or restrict to your domain) on every response.
**Warning signs:** Network tab shows `OPTIONS` request failing with 405 before the `POST`.

### Pitfall 2: Edge Function Cold Start on First Message
**What goes wrong:** First AI coach invocation takes 1-3 seconds with no feedback; user thinks it's broken.
**Why it happens:** Deno Edge Functions have a cold start penalty on first invocation after idle.
**How to avoid:** Show a "Connecting..." spinner immediately when the fetch starts, before any tokens arrive. The existing `setStreaming(true)` pattern handles this if the UI reflects it.
**Warning signs:** Long pause before first token appears in drawer.

### Pitfall 3: WheelChart Colors Not Responding to Palette Change
**What goes wrong:** Switching palette updates sidebar/buttons but WheelChart radar fills stay amber.
**Why it happens:** Recharts reads `stroke` and `fill` as JavaScript string props at render time, not from CSS. CSS custom properties on `:root` do NOT propagate into SVG attribute values set as JSX props.
**How to avoid:** WheelChart must receive explicit color props from the parent (WheelPage) which reads them from PaletteContext. Never use `var(--palette-primary)` as a Recharts prop string.
**Warning signs:** Palette swatcher works on all HTML elements but radar chart stays the same color.

### Pitfall 4: Streaming Text Appearing as Raw JSON in Chat
**What goes wrong:** The proposal sentinel `{"type":"score_proposal",...}` appears as raw text in the chat bubble.
**Why it happens:** The frontend renders `accumulated` directly without stripping the sentinel before display.
**How to avoid:** `detectAndSetProposal()` must strip the sentinel from `displayText` while keeping it for parsing. Maintain two separate strings: `rawAccumulated` (full) for parsing and `displayContent` (stripped) for rendering.
**Warning signs:** Chat bubble shows JSON object at the end of a coaching response.

### Pitfall 5: Palette Not Applied on App Load (Flash of Default)
**What goes wrong:** User loads the app and sees amber palette for a brief moment before their saved palette loads.
**Why it happens:** `useProfile` fetches `color_scheme` asynchronously; `applyPalette` is called only after fetch resolves.
**How to avoid:** Apply the palette eagerly from localStorage as a synchronous side effect before React renders (in `main.tsx` or `index.html` inline script), then confirm/correct once `useProfile` resolves. Alternatively, persist palette choice in localStorage as a fast path.
**Warning signs:** Visible flash/flicker of amber colors on page load for non-amber palette users.

### Pitfall 6: RLS Missing on ai_chat_messages Table
**What goes wrong:** Users can read each other's coaching conversations.
**Why it happens:** Easy to forget RLS on a new table — established project pattern (every migration must enable RLS).
**How to avoid:** Migration must include `ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY` and SELECT/INSERT/DELETE policies scoped to `auth.uid() = user_id`.
**Warning signs:** Test query in Supabase Studio without auth returns rows from other users.

### Pitfall 7: `supabase.auth.getUser()` vs `getClaims()` in Edge Function
**What goes wrong:** Auth validation rejects valid tokens or accepts invalid ones.
**Why it happens:** There are two patterns in Supabase docs. `getClaims()` is the newer local JWT decode (no network call). `getUser()` makes a network call to verify against the Auth service.
**How to avoid:** Use `supabase.auth.getUser(token)` for correctness — it hits the Auth service and handles revoked tokens. `getClaims()` is faster but won't catch revoked sessions.
**Warning signs:** Logged-out users still able to call the Edge Function.

---

## Code Examples

Verified patterns from official sources:

### Edge Function Secrets Access
```typescript
// Source: Supabase Edge Functions docs — Deno.env pattern
const apiKey = Deno.env.get('ANTHROPIC_API_KEY')!
// Set locally: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Check: supabase secrets list
```

### pg_cron Cleanup Job (in migration SQL)
```sql
-- Source: Supabase pg_cron docs — schedule pattern
-- Enable extension (already available in Supabase Postgres)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly deletion of old chat messages
SELECT cron.schedule(
  'delete-old-ai-chat-messages',      -- job name (must be unique)
  '0 3 1 * *',                        -- 3am on 1st of each month
  $$DELETE FROM public.ai_chat_messages WHERE created_at < NOW() - INTERVAL '3 months'$$
);
```

### Anthropic Streaming with TypeScript SDK (Deno)
```typescript
// Source: Anthropic TypeScript SDK — messages.create with stream:true
// Iterate directly (for await) for SSE token events
const stream = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  stream: true,
  system: systemPrompt,
  messages: conversationHistory,
})

for await (const event of stream) {
  if (
    event.type === 'content_block_delta' &&
    event.delta.type === 'text_delta'
  ) {
    // event.delta.text is the incremental token
    controller.enqueue(encoder.encode(event.delta.text))
  }
}
```

### Frontend ReadableStream Consumption
```typescript
// Source: MDN ReadableStream — getReader() pattern
const reader = res.body.getReader()
const decoder = new TextDecoder()
let accumulated = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  accumulated += decoder.decode(value, { stream: true })
  // Update React state incrementally
}
```

### CSS Custom Properties Applied to :root at Runtime
```typescript
// Source: MDN CSSStyleDeclaration.setProperty — :root injection pattern
// Called from PaletteContext on app mount and on swatch click
document.documentElement.style.setProperty('--palette-primary', '#e8a23a')
document.documentElement.style.setProperty('--palette-secondary', '#60a5fa')
// ... etc
```

### ai_chat_messages Table Migration Skeleton
```sql
-- supabase/migrations/20260319000001_ai_chat_messages.sql
CREATE TABLE public.ai_chat_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_chat_messages_user_category_idx
  ON public.ai_chat_messages (user_id, category_id, created_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_messages: select own" ON public.ai_chat_messages
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "ai_chat_messages: insert own" ON public.ai_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "ai_chat_messages: delete own" ON public.ai_chat_messages
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Hardcoded hex strings in WheelChart | CSS var props passed through PaletteContext | Enables runtime palette switching without rebuild |
| `import.meta.env.DEV` only for tier toggle | `DEV \|\| VITE_SHOW_TIER_TOGGLE === 'true'` | Enables staging environment testing of tier switching |
| No AI assistance | Streaming AI coaching chat per category | Lowers friction of self-scoring; premium differentiator |

**Deprecated/outdated patterns in this codebase:**
- Hardcoded radar chart fill/stroke colors in `WheelChart.tsx` — Phase 9 replaces with props
- Single-env dev toggle in `SettingsPage.tsx` — extended to dual-env check

---

## Open Questions

1. **Palette CSS vars in sidebar background**
   - What we know: `Sidebar.tsx` uses `bg-[#292524]` or `surface-sidebar` Tailwind token (static). The palette accent needs to replace the sidebar background.
   - What's unclear: Whether to add an inline style to `Sidebar.tsx` driven by `PaletteContext`, or add a `palette-accent` Tailwind token that reads `var(--palette-accent)` — the latter requires `tailwind.config.ts` changes.
   - Recommendation: Add `palette.accent` to `tailwind.config.ts` as `'var(--palette-accent)'` and use `bg-palette-accent` in Sidebar. This keeps styling in class names, not inline styles.

2. **Edge Function local testing**
   - What we know: `supabase functions serve ai-coach` runs the function locally with `supabase start`.
   - What's unclear: Whether `ANTHROPIC_API_KEY` must be in `.env.local` or in a `.env` file for local serve.
   - Recommendation: Use `supabase secrets set --env-file .env.local` pattern; document in Edge Function comments. For unit tests, mock the fetch call to the Edge Function URL — do not test the Deno function with Vitest (different runtimes).

3. **Proposal card timing — when to show**
   - What we know: Proposal appears when AI has enough context; sentinel is emitted mid-stream or at end of a message turn.
   - What's unclear: Whether `detectAndSetProposal` should run on every chunk (mid-stream) or only after streaming completes.
   - Recommendation: Run detection only after streaming completes (the sentinel will always be the last element of an assistant message). Mid-stream detection risks showing a partial JSON as a proposal.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (already installed) |
| Config file | `vite.config.ts` (vitest config embedded) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | `useAiChat` sends messages, streams tokens, detects proposal | unit | `npm test -- --run src/hooks/useAiChat.test.ts` | ❌ Wave 0 |
| AI-01 | `AiCoachDrawer` renders thread, shows proposal card, calls onApplyAsis/onApplyTobe | unit | `npm test -- --run src/components/AiCoachDrawer.test.tsx` | ❌ Wave 0 |
| AI-01 | `CategorySlider` renders AI Coach button, calls onAiCoach | unit | `npm test -- --run src/components/CategorySlider.test.tsx` | ✅ (extend existing) |
| PREMIUM-01 | `SettingsPage` shows tier toggle when `VITE_SHOW_TIER_TOGGLE=true` | unit | `npm test -- --run src/pages/SettingsPage.test.tsx` | ✅ (extend existing) |
| PREMIUM-02 | `useProfile` reads/writes `color_scheme`, calls `updateColorScheme` | unit | `npm test -- --run src/hooks/useProfile.test.ts` | ✅ (extend existing) |
| PREMIUM-02 | `ColorSchemePicker` renders swatches, calls onSelect, shows lock for free users | unit | `npm test -- --run src/components/ColorSchemePicker.test.tsx` | ❌ Wave 0 |
| PREMIUM-02 | `PaletteContext` calls `applyPalette` on mount and swatch select | unit | `npm test -- --run src/contexts/PaletteContext.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (full suite, ~10s)
- **Per wave merge:** `npm test -- --run && npm run build`
- **Phase gate:** Full suite green + manual AI chat smoke test before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useAiChat.test.ts` — covers AI-01 streaming and proposal detection
- [ ] `src/components/AiCoachDrawer.test.tsx` — covers AI-01 drawer UI
- [ ] `src/components/ColorSchemePicker.test.tsx` — covers PREMIUM-02 swatch UI
- [ ] `src/contexts/PaletteContext.test.tsx` — covers PREMIUM-02 runtime palette application
- [ ] `supabase/functions/ai-coach/index.ts` — Edge Function itself is NOT tested with Vitest (Deno runtime); covered by manual smoke test only

---

## Sources

### Primary (HIGH confidence)
- Anthropic TypeScript SDK docs (streaming): `messages.create({ stream: true })` + `for await` iterator over `content_block_delta` events — verified from official Anthropic docs
- Supabase Edge Functions streaming example (ElevenLabs) — `ReadableStream` wrapper + `Deno.env.get` secrets pattern — verified from official Supabase docs
- Supabase Edge Functions auth guide — `supabase.auth.getUser(token)` JWT validation pattern — verified from official Supabase docs
- Supabase pg_cron docs — `SELECT cron.schedule(...)` syntax — verified from official Supabase docs
- MDN `CSSStyleDeclaration.setProperty` — `:root` CSS variable injection pattern — well-established browser API

### Secondary (MEDIUM confidence)
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron) — pg_cron 1.6.4, `cron.schedule()` syntax
- [Anthropic Streaming Docs](https://platform.claude.com/docs/en/api/messages-streaming) — SSE event types, `content_block_delta`, `text_delta`
- [Supabase Edge Functions Streaming Example](https://supabase.com/docs/guides/functions/examples/elevenlabs-generate-speech-stream) — ReadableStream + `Deno.env.get` pattern

### Tertiary (LOW confidence)
- Sentinel JSON approach for structured data in a streaming channel — common pattern described in community posts, not official doc; reasonable for this use case

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Deno + Anthropic SDK + pg_cron all verified from official docs
- Architecture: HIGH — all patterns derive from existing codebase conventions + official sources
- Pitfalls: HIGH — Recharts CSS var limitation (known constraint), CORS pattern (official), RLS pattern (project convention)
- CSS palette system: MEDIUM — CSS vars on `:root` injected via JS is correct for Tailwind v3; exact Tailwind config token wiring is Claude's discretion

**Research date:** 2026-03-19
**Valid until:** 2026-05-01 (stable APIs; Anthropic model ID may need updating if `claude-haiku-4-5-20251001` is superseded)
