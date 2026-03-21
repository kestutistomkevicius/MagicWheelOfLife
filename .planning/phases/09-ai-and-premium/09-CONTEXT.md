# Phase 9: AI & Premium - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Three requirements: (1) per-category AI coaching chat that asks guided questions and suggests as-is/to-be scores for the user to confirm, (2) tier switcher visible in dev AND staging environments, (3) a color palette selector in Settings that changes the wheel chart colors and UI accent (sidebar, buttons) immediately and persists per-user.

</domain>

<decisions>
## Implementation Decisions

### AI Chat — Panel Placement & Trigger
- **Trigger**: An "AI Coach" button in the CategorySlider header row (next to the star icon)
- **Panel**: Slide-in drawer from the right side of the screen, overlaying WheelPage
- **Drawer contents**: Category name at top, chat thread in the middle (scrollable), proposal card pinned at the bottom when AI has a score ready
- **Free users**: Clicking "AI Coach" opens an upgrade modal — same pattern as the star/priority feature for free users

### AI Chat — Conversation & Score Flow
- **Conversation style**: Curious coach — AI opens knowing the category name and current as-is/to-be scores; asks reflective follow-up questions; adapts number of questions based on response quality (asks more if vague, fewer if detailed)
- **Score suggestion**: AI decides when it has enough context to suggest; outputs a structured proposal card with both as-is AND to-be suggested values
- **Apply UX**: Proposal card has two independent buttons — "Apply to As-Is" and "Apply to To-Be"; applying either replaces the score immediately (same as slider commit, no extra save step)
- **Score confirmation**: User confirms by clicking Apply — no score is ever saved without explicit user action
- **Conversation history**: Persisted to DB per user per category; messages auto-deleted after 3 months; requires new `ai_chat_messages` table with created_at index for cleanup
- **Session resume**: Reopening the drawer for the same category restores the conversation thread

### AI Chat — Technical Architecture
- **API routing**: Supabase Edge Function (`supabase/functions/ai-coach/`) proxies requests to Anthropic; API key stored as Supabase secret (never in browser bundle)
- **Auth gate**: Edge Function validates Supabase JWT; only authenticated premium users can call it
- **Model**: Configured via Supabase secret (`ANTHROPIC_MODEL`); defaults to `claude-haiku-4-5-20251001`; changing the secret takes effect on next Edge Function invocation (no redeployment required)
- **Streaming**: Responses streamed token-by-token via `ReadableStream`; frontend renders tokens as they arrive
- **Error handling**: Inline error message in the chat thread with a Retry button that resends the last user message

### AI Chat — Context Passed to Edge Function
- Category name
- Current as-is score (1–10)
- Current to-be score (1–10)
- Full conversation history (array of `{role, content}` messages)

### Color Scheme — Scope & Palettes
- **Scope**: Full theme swap — changing palette updates both wheel chart colors (As-Is, To-Be, Important Radar fills) AND UI accent (sidebar background, brand amber used in buttons/highlights throughout the app)
- **Mechanism**: CSS custom properties (`--palette-primary`, `--palette-secondary`, etc.) set on `:root` at runtime; Tailwind classes reference these variables; WheelChart receives palette-derived color props
- **Number of palettes**: 4–5 predefined palettes to start, including Amber (current default) so existing users see no change
- **Gating**: Premium-only; free users see the swatch grid with a lock overlay and upgrade prompt on click

### Color Scheme — Selector UX
- **Placement**: In SettingsPage, below the existing Plan section (where `/* TODO Phase 9 */` comment is)
- **UI**: Color swatch grid — circular swatches, selected swatch has a ring/checkmark indicator
- **Interaction**: Click swatch → palette applied immediately everywhere (wheel, sidebar, buttons) AND persisted to DB; no Save button required
- **Default**: Amber palette (`amber`) — the current hardcoded colors become Palette 1

### Color Scheme — Storage
- **Location**: `color_scheme` column (text, default `'amber'`) on the `profiles` table — per-user setting, same palette on all wheels
- **DB change**: Migration to add `color_scheme` to `profiles`; `useProfile` extended to read/write it

### PREMIUM-01 — Tier Toggle Visibility
- **Current state**: Dev-only toggle exists in SettingsPage using `import.meta.env.DEV`
- **Required change**: Also show in staging; use an env var `VITE_SHOW_TIER_TOGGLE=true` in staging environment; condition becomes `import.meta.env.DEV || import.meta.env.VITE_SHOW_TIER_TOGGLE === 'true'`
- **Production**: Toggle hidden (neither env var set in production)

### Claude's Discretion
- Exact CSS variable names and how they map to Tailwind tokens (extend tailwind.config.ts or inject via JS)
- Specific hex values for each of the 4–5 palettes (within warm/earthy family for default; other palettes can use cooler tones)
- System prompt wording for the AI coach
- Chat message bubble styling within the drawer
- Exact shape/layout of the proposal card (must show two suggested values and two Apply buttons clearly)
- Cleanup job implementation for 3-month chat history retention (pg_cron vs scheduled Edge Function)
- Whether palette change triggers a smooth CSS transition or instant swap

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CategorySlider.tsx`: Header row already has `star` icon slot — "AI Coach" button goes in the same row, following the same prop pattern (`onAiCoach`, `isPremium`)
- `SettingsPage.tsx`: Has `/* TODO Phase 9: color scheme selector (PREMIUM-02) */` comment marking exact insertion point
- `useProfile.ts`: Already reads/writes `tier` and `avatar_url` from `profiles`; extend to also read/write `color_scheme`
- `WheelChart.tsx`: Colors hardcoded as hex strings (`#e8a23a`, `#60a5fa`, `#b45309`, `#fbbf24`) — Phase 9 replaces these with palette-derived props
- `SnapshotNameDialog.tsx`: Existing modal pattern for the upgrade modal (free user AI lock) — plain Tailwind modal, no Radix portal
- `tailwind.config.ts`: `brand` token family and `surface` tokens defined; palette system may extend these or override via CSS vars

### Established Patterns
- Dev-only UI: `import.meta.env.DEV` conditional in SettingsPage — PREMIUM-01 extends this to also check `VITE_SHOW_TIER_TOGGLE`
- Tier gating: `isPremium` boolean derived from `useProfile` tier — passed as prop to components (star feature, category gate)
- Optimistic updates: local state set immediately, DB write async (all existing useProfile/useWheel mutations)
- Modal pattern: plain Tailwind div with backdrop, no shadcn Dialog — consistent with FeatureRequestModal and SnapshotNameDialog

### Integration Points
- `CategorySlider.tsx`: Add "AI Coach" button to header row; receives `onAiCoach` and `isPremium` props from WheelPage
- `WheelPage.tsx`: Manages AI drawer open state + selected category; passes palette-derived colors to WheelChart
- `SettingsPage.tsx`: Color swatch grid inserted at TODO comment; calls `useProfile.updateColorScheme`
- `AppShell.tsx` / `Sidebar.tsx`: Reads current palette from context/profile and applies CSS variables to root element
- `supabase/functions/ai-coach/index.ts`: New Deno Edge Function — JWT validation, Anthropic streaming call, conversation history from DB
- `supabase/migrations/`: Two new migrations — `ai_chat_messages` table + `color_scheme` column on profiles
- `src/types/database.ts`: Add `ai_chat_messages` row type; extend `ProfileRow` with `color_scheme`

</code_context>

<specifics>
## Specific Ideas

- AI opening message should reference the category and current score immediately: "I see your **Health** is currently at 6 out of 10. Tell me — what does your day-to-day health feel like right now?"
- The proposal card should feel distinct from chat bubbles — slightly elevated card with a horizontal rule separator, showing: "Suggested scores: **As-Is: 5** · **To-Be: 8**" with two buttons below
- For palette CSS vars: consider injecting them on `<html>` or `<body>` so Tailwind utility classes can reference them via `var()` without full Tailwind rebuild
- The 3-month cleanup could be a pg_cron job: `DELETE FROM ai_chat_messages WHERE created_at < NOW() - INTERVAL '3 months'` — simple and reliable
- Amber palette (default) should preserve current exact hex values so no visual regression for existing users

</specifics>

<deferred>
## Deferred Ideas

- **PREMIUM-01 staging scope** — The requirement is satisfied by the `VITE_SHOW_TIER_TOGGLE` env var approach; no separate discussion needed
- **Per-wheel color palettes** — User confirmed per-user storage for now; per-wheel is a potential v2 enhancement
- **AI chat rate limiting for free users** — Free users are fully locked out (upgrade modal); no partial access or rate limits needed in Phase 9
- **AI chat on mobile** — Right-side drawer may need full-screen treatment on mobile; deferred to responsive polish pass
- **AI suggesting action items** — AI currently only suggests scores; suggesting action items is a natural extension but out of scope for Phase 9

</deferred>

---

*Phase: 09-ai-and-premium*
*Context gathered: 2026-03-19*
