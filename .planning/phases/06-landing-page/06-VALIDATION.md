---
phase: 6
slug: landing-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1 + @testing-library/react 16 |
| **Config file** | `vite.config.ts` (inline `test` block) |
| **Quick run command** | `npm test -- --run src/pages/LandingPage.test.tsx` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run src/pages/LandingPage.test.tsx`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | LAND-01 | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | LAND-01 | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | LAND-01 | integration | `npm test -- --run src/components/ProtectedRoute.test.tsx` | ✅ extend | ⬜ pending |
| 06-01-04 | 01 | 2 | LAND-02 | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 2 | LAND-03 | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-06 | 01 | 2 | LAND-04 | unit | `npm test -- --run src/pages/LandingPage.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/pages/LandingPage.test.tsx` — stubs for LAND-01, LAND-02, LAND-03, LAND-04
- [ ] Mocks: `useAuth`, `useNavigate`, `WheelChart`, `ComparisonChart` following existing patterns

*Existing infrastructure (vitest, @testing-library/react, setup.ts) covers all other requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual scroll animation (IntersectionObserver fade-in) | LAND-01 | jsdom doesn't support IntersectionObserver natively | Load http://localhost:5173 in browser, scroll down, confirm sections animate in |
| Wheel chart renders correctly in demo section | LAND-02 | SVG rendering not reliable in jsdom | Load page, verify animated wheel demo is visible and styled |
| Responsive layout (tablet/desktop) | LAND-01 | CSS media queries require real viewport | Resize browser, confirm layout remains usable at tablet and desktop widths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
