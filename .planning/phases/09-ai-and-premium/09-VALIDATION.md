---
phase: 9
slug: ai-and-premium
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react (already installed) |
| **Config file** | `vite.config.ts` (vitest config embedded) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green + manual AI chat smoke test
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-W0-01 | Wave 0 | 0 | AI-01 | unit stub | `npm test -- --run src/hooks/useAiChat.test.ts` | ❌ Wave 0 | ⬜ pending |
| 9-W0-02 | Wave 0 | 0 | AI-01 | unit stub | `npm test -- --run src/components/AiCoachDrawer.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-W0-03 | Wave 0 | 0 | PREMIUM-02 | unit stub | `npm test -- --run src/components/ColorSchemePicker.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-W0-04 | Wave 0 | 0 | PREMIUM-02 | unit stub | `npm test -- --run src/contexts/PaletteContext.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-DB-01 | DB | 1 | AI-01 | manual | Supabase Studio: verify `ai_chat_messages` table exists with RLS | ❌ (migration) | ⬜ pending |
| 9-DB-02 | DB | 1 | PREMIUM-02 | manual | Supabase Studio: verify `color_scheme` column on `profiles` | ❌ (migration) | ⬜ pending |
| 9-EF-01 | Edge Fn | 2 | AI-01 | manual | `supabase functions serve ai-coach` + curl smoke test with JWT | ❌ Wave 0 | ⬜ pending |
| 9-HOOK-01 | Hooks | 2 | AI-01 | unit | `npm test -- --run src/hooks/useAiChat.test.ts` | ❌ Wave 0 | ⬜ pending |
| 9-HOOK-02 | Hooks | 2 | PREMIUM-02 | unit | `npm test -- --run src/hooks/useProfile.test.ts` | ✅ (extend) | ⬜ pending |
| 9-CTX-01 | Context | 2 | PREMIUM-02 | unit | `npm test -- --run src/contexts/PaletteContext.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-UI-01 | UI | 3 | AI-01 | unit | `npm test -- --run src/components/AiCoachDrawer.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-UI-02 | UI | 3 | AI-01 | unit | `npm test -- --run src/components/CategorySlider.test.tsx` | ✅ (extend) | ⬜ pending |
| 9-UI-03 | UI | 3 | PREMIUM-02 | unit | `npm test -- --run src/components/ColorSchemePicker.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 9-WIRE-01 | Wire | 4 | PREMIUM-01 | unit | `npm test -- --run src/pages/SettingsPage.test.tsx` | ✅ (extend) | ⬜ pending |
| 9-WIRE-02 | Wire | 4 | AI-01, PREMIUM-02 | manual | Browser smoke: open drawer, chat, apply score, switch palette | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useAiChat.test.ts` — stubs for AI-01 streaming and proposal detection
- [ ] `src/components/AiCoachDrawer.test.tsx` — stubs for AI-01 drawer UI (thread, proposal card, apply buttons)
- [ ] `src/components/ColorSchemePicker.test.tsx` — stubs for PREMIUM-02 swatch grid and lock overlay
- [ ] `src/contexts/PaletteContext.test.tsx` — stubs for PREMIUM-02 runtime palette application

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase Edge Function streaming works end-to-end | AI-01 | Deno runtime — not testable with Vitest | `supabase functions serve ai-coach`, call with valid JWT, verify tokens stream to browser |
| AI chat drawer opens from CategorySlider and restores history | AI-01 | Requires Supabase + Anthropic live connection | Log in as premium user, open wheel, click AI Coach, send message, close and reopen drawer |
| Score apply buttons update wheel without page reload | AI-01 | Live state mutation across components | Chat until proposal appears, click "Apply to As-Is", verify wheel segment updates immediately |
| Palette CSS vars update wheel chart AND sidebar accent | PREMIUM-02 | CSS custom property propagation into SVG props | Open Settings as premium, click each swatch, verify WheelChart colors AND sidebar/button accent update |
| Tier toggle visible in dev and when VITE_SHOW_TIER_TOGGLE=true | PREMIUM-01 | Environment variable behavior | Run with env var set and unset; verify toggle visibility matches |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
