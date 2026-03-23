# Self-Improving Claude Code — Research & Implementation Guide

> How to make every session smarter than the last.
> Tailored for GSD (Get Shit Done) workflow users.

---

## The Core Problem Claude Has

Claude Code has **no memory between sessions**. Every session starts cold. Without explicit systems, you repeat corrections, re-explain preferences, and watch Claude make the same mistakes across weeks of work.

The research consensus on solving this:

> *"Files do. Every important insight must be written to disk or it's lost."*

The solution is a **self-reinforcing feedback loop**: sessions write learnings to disk → those files are read next session → Claude starts smarter → fewer corrections → better sessions.

---

## The Four Memory Layers (from research)

These layers form a hierarchy. Each survives different failure modes.

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1 — CLAUDE.md         (rules + conventions)           │
│  Layer 2 — LEARNINGS.md      (discoveries + corrections)     │
│  Layer 3 — .planning/ files  (GSD plans + task context)      │
│  Layer 4 — MEMORY.md         (auto-written by Claude itself) │
└──────────────────────────────────────────────────────────────┘
```

Each layer has a job:

| Layer | Who writes it | Lifespan | What it holds |
|---|---|---|---|
| `CLAUDE.md` | You (with Claude's help) | Permanent | Conventions, architecture, hard rules |
| `LEARNINGS.md` | Claude (you approve) | Permanent | Discoveries, API quirks, solved problems |
| `.planning/` | GSD system | Per-feature | Plans, research, verification results |
| `MEMORY.md` | Claude automatically | Auto-managed | Build commands, debugging insights |

---

## Layer 1: CLAUDE.md — The META Section (The Key Innovation)

The breakthrough from the research is not just *having* a CLAUDE.md — it's teaching Claude **how to write good rules**. Add a META section that instructs Claude on rule quality:

```markdown
## META — How to Maintain This Document

### When to add a rule
Add a rule when:
- Claude made the same mistake twice
- A correction improved output significantly
- A pattern emerged across 3+ tasks

Do NOT add a rule for:
- One-off situations that won't recur
- Things already in standard TypeScript/React docs
- Obvious best practices Claude already follows

### How to write a rule (always follow this format)
1. Start with ALWAYS or NEVER (absolute directive)
2. State WHY in 1–2 bullets (the problem it prevents)
3. Give ONE concrete code example if the pattern is non-obvious
4. Keep it under 5 lines total — if it needs more, it's two rules

### Anti-bloat rules
- ❌ Don't add "Warning Signs" sections to obvious rules
- ❌ Don't show bad examples for trivial mistakes  
- ❌ Don't explain with paragraphs what bullets can convey
- ✅ When a rule changes behavior 2+ times → promote it to the top "Critical Rules" section
- ✅ When LEARNINGS.md has 3+ entries on the same topic → extract to a rule here and delete from LEARNINGS.md
```

**Why this works**: Every session Claude reads this and knows *how to teach itself*. When you say "reflect on this mistake and write it to CLAUDE.md," it follows the meta-rules automatically. The document doesn't just grow — it grows well.

---

## Layer 2: LEARNINGS.md — The Living Feedback File

Create `docs/LEARNINGS.md` (or `.claude/LEARNINGS.md`) in your project root.

### Structure

```markdown
# Project Learnings

> Updated by Claude at session end. Reviewed weekly.
> Format: [YYYY-MM-DD] Category: Learning

---

## Consolidated Principles
<!-- Promoted from dated entries after appearing 3+ times -->
<!-- These become the most valuable part over time -->

- Always use `uv` not `pip` for this project (confirmed 2025-01-15)
- The webhook endpoint requires HMAC in the header, not body (confirmed 2025-01-20)
- Drizzle `.returning()` must chain before `.execute()` not after (confirmed 2025-02-01)

---

## Recent Discoveries

### API & Integration Quirks
- [2025-03-10] Stripe: webhook signature verification fails if body is parsed before raw buffer captured
- [2025-03-05] Clerk: `currentUser()` returns null in middleware — use `auth()` instead

### Patterns That Worked
- [2025-03-08] Zod discriminated unions eliminated 3 runtime type errors in the checkout flow
- [2025-03-01] Using `useSWRImmutable` for static config data cut unnecessary refetches by 80%

### Mistakes & Corrections
- [2025-03-12] CORRECTED: Was using `router.refresh()` after mutations — should use `revalidatePath()` from the server action instead
- [2025-03-09] CORRECTED: Was putting `"use client"` on layout files — this prevents RSC streaming

### GSD Session Notes
<!-- Context that helps resume multi-session work -->
- [2025-03-12] Auth refactor paused mid-session. Left off at: middleware token validation. Next: update protected routes.
- [2025-03-10] Phase 2 of dashboard feature complete. Phase 3 (charts) starts next.

---

## Pruning Log
<!-- Track what was consolidated or removed and why -->
- [2025-03-01] Promoted "router.refresh vs revalidatePath" to CLAUDE.md rule — corrected 3 times
- [2025-02-15] Removed outdated note about Prisma migration — migrated to Drizzle
```

### The Magic One-Liner

When Claude makes a mistake and you correct it:

> **"Reflect on this mistake. Abstract and generalize the learning. Write it to LEARNINGS.md."**

That's the core loop. One sentence triggers: reflect → abstract → write.

---

## Layer 3: GSD Integration — Making Plans Persist

GSD already creates `.planning/` files, which is excellent architecture. The plans survive session boundaries. Here's how to reinforce this with learnings:

### At session start (GSD `SessionStart` hook)

When Claude Code starts, it should automatically:
1. Read the current GSD phase plan
2. Read `LEARNINGS.md` for relevant context
3. Summarize where the previous session ended

Add this to your `SessionStart` hook or CLAUDE.md:

```markdown
## Session Bootstrap (read on every session start)

Before doing any work:
1. Check `.planning/` for the active phase plan — read it
2. Read `docs/LEARNINGS.md` — apply consolidated principles
3. If resuming work: State "Resuming from: [last session endpoint in LEARNINGS.md]"
4. If starting fresh: State "Starting phase [N] — plan: [plan file]"
```

### At session end (the retrospective)

GSD's own philosophy already includes verification gates. Add a **session retrospective** as the final GSD step:

```markdown
## Post-Task Retrospective (run after any GSD phase completion)

After verifying a task passes GSD's acceptance criteria:

1. What did I discover about this codebase that wasn't in CLAUDE.md?
2. Did I make any mistakes that were corrected? What pattern do they reveal?
3. What would have made this task faster/smoother?
4. Is there anything the NEXT session needs to know to resume cleanly?

Write findings to docs/LEARNINGS.md following the format.
```

---

## Layer 4: Automatic Memory (MEMORY.md)

Claude Code can write to `~/.claude/MEMORY.md` itself — it's the only memory file Claude Code actively updates. It stores things like build commands and debugging insights across sessions without you writing anything.

This is your free, zero-effort baseline. Add a project-level `MEMORY.md` at `.claude/MEMORY.md` to extend it:

```markdown
# Auto Memory — Project-Level

## Key Facts (auto-updated by Claude)
- Build system: pnpm (not npm or yarn)
- Dev server port: 3001 (3000 conflicts with proxy)
- Test runner: Vitest — use `pnpm test:unit` not `pnpm test`

## Corrections Log
<!-- Claude appends here automatically when corrected -->
- [LEARN:db] Drizzle `.where()` must use `eq()` operator, not JS equality
- [LEARN:auth] Session cookie name is `__session` not `session`
- [LEARN:api] Paginated endpoints return `{ items, nextCursor }` not `{ data, meta }`
```

---

## The Stop Hook — Automated Session-End Reflection

This is the most powerful automation: use a **Stop hook** to trigger reflection automatically at the end of every session.

### `.claude/settings.json` hook addition

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/session-end-reflect.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### `.claude/hooks/session-end-reflect.sh`

```bash
#!/bin/bash
# Inject a session-end reflection prompt into Claude's context

cat << 'EOF'
{
  "type": "feedback",
  "message": "SESSION END — Before closing: Review what happened this session. Check if any corrections were made, patterns noticed, or API quirks discovered. If yes, append them to docs/LEARNINGS.md following the established format. Keep entries specific, dated, and actionable. If nothing notable happened, skip."
}
EOF
```

This fires every time Claude finishes a task. Claude sees the message and decides whether anything is worth writing down. It's low-friction because Claude judges relevance — you don't have to remember to ask.

---

## The Weekly Consolidation Prompt

Raw learnings accumulate. Run this monthly (or every 2 weeks) to keep LEARNINGS.md from becoming a dump:

```
Open docs/LEARNINGS.md. Review all entries. Do the following:

1. Remove entries that are outdated, superseded, or no longer apply
2. Merge duplicate or closely related entries into one
3. Identify entries that appear 3+ times → extract as a rule to CLAUDE.md, then delete from LEARNINGS.md
4. Move the most durable learnings into "Consolidated Principles" at the top
5. Flag anything needing human review with [REVIEW NEEDED]

Show me a diff of what changed before saving.
```

After a few consolidation runs, the "Consolidated Principles" section becomes the most valuable part of the file — standing rules Claude applies without you having to re-explain them every session.

---

## GSD-Specific Integration Points

GSD already does excellent context engineering. Here's where self-improvement plugs in naturally:

### 1. After `RESEARCH.md` is written
```
After generating the research document, append a "Session Notes" entry
to LEARNINGS.md noting any assumptions made and why. This helps the next
session challenge wrong assumptions before building on them.
```

### 2. After each `PLAN.md` is executed
```
After the verification step passes, write a brief retrospective to
LEARNINGS.md: what worked, what had to be adjusted, any surprises.
```

### 3. When a GSD task fails verification
```
If verification fails, BEFORE retrying: write a "CORRECTED" entry to
LEARNINGS.md explaining what went wrong and what the correct approach is.
This prevents the same mistake in the retry and in future sessions.
```

### 4. Post-mortem for stuck/failed sessions
GSD supports post-mortem investigation of failed runs. Add a slash command:

**`.claude/commands/post-mortem.md`**
```markdown
---
description: Investigate a failed or stuck GSD session and extract learnings
allowed-tools: Read, Bash(git:*), Grep
---

Investigate what went wrong in the most recent GSD session.

Steps:
1. Read `.planning/` for the failed phase plan
2. Run `git log --oneline -20` to see recent commits (or lack thereof)
3. Identify: where did it get stuck? what was the last successful step?
4. Diagnose: was it a wrong assumption, a missing tool, a context issue?
5. Write findings to docs/LEARNINGS.md under "Mistakes & Corrections"
6. Suggest: should the plan be revised before retrying?

$ARGUMENTS
```

---

## The `/reflect` Command

Create a dedicated slash command for on-demand reflection:

**`.claude/commands/reflect.md`**
```markdown
---
description: Reflect on this session and update learnings. Run at any point to capture insights mid-session, or at end of session for final capture.
allowed-tools: Read, Write
---

Review the work from this session and the current LEARNINGS.md.

Identify new learnings that meet ALL of these criteria:
- **Specific**: Names a concrete behavior, API, or pattern (not "be careful with state")
- **Reusable**: A future Claude session would benefit from knowing this
- **Actionable**: It changes how code is written
- **Non-obvious**: Not already covered in CLAUDE.md or standard docs

For each learning found:
1. Categorize it (API Quirk / Pattern / Mistake Corrected / GSD Session Note)
2. Write it to docs/LEARNINGS.md with today's date
3. If it's a correction, start with "CORRECTED:"
4. If it's a session handoff note, start with "HANDOFF:"

Then: check if any "Consolidated Principles" need updating.

Do not write things that are general coding best practices.
Do not write one-off situations that won't recur.
```

---

## What a Great LEARNINGS Entry Looks Like

### ✅ Good entries

```
[2025-03-15] CORRECTED: Was calling `revalidatePath('/dashboard')` inside
a try/catch — revalidatePath throws on error, so errors were being
silently swallowed. Move revalidatePath after the try/catch.

[2025-03-14] Stripe webhook: raw body must be captured before any
body-parser middleware. Express `express.raw()` must run first.

[2025-03-12] HANDOFF: Phase 3 (Charts) paused. Completed: data fetching
hook. Remaining: ResponsiveContainer wrapping + skeleton states.
Next session start: `src/components/dashboard/RevenueChart.tsx`
```

### ❌ Bad entries (don't write these)

```
[2025-03-15] Always handle errors properly in async functions.
(Too generic — already in any style guide)

[2025-03-14] Used React Query for fetching.
(Not a learning — it's a decision that's already in CLAUDE.md)

[2025-03-12] The dashboard looks good.
(Not actionable)
```

---

## Implementation Checklist

### Week 1 — Foundation
- [ ] Add META section to CLAUDE.md (copy from this doc)
- [ ] Create `docs/LEARNINGS.md` with the structure above
- [ ] Create `.claude/commands/reflect.md`
- [ ] Try the one-liner after the next correction: *"Reflect on this mistake, write it to LEARNINGS.md"*

### Week 2 — Automation
- [ ] Add Stop hook → `session-end-reflect.sh`
- [ ] Create `.claude/commands/post-mortem.md`
- [ ] Add session bootstrap instructions to CLAUDE.md

### Week 3 — GSD Integration
- [ ] Add retrospective step to your GSD workflow (after verification passes)
- [ ] Add "HANDOFF:" note pattern to your end-of-session habit
- [ ] First consolidation pass on LEARNINGS.md

### Monthly
- [ ] Run weekly consolidation prompt
- [ ] Prune CLAUDE.md rules that Claude already follows without them
- [ ] Review if any LEARNINGS entries should become permanent CLAUDE.md rules

---

## Expected Progression

Based on community reports:

| Sessions | What improves |
|---|---|
| 1–5 | LEARNINGS.md seeds; correction loop established |
| 5–15 | First consolidation; 2–3 durable rules extracted to CLAUDE.md |
| 15–30 | Claude starts anticipating corrections before you make them |
| 30+ | The system compounds — session quality is noticeably higher than week 1 |

The cold-start quality of Session 1 learnings may be thin. The system may need 3–5 sessions before the improvement loop becomes meaningful. Don't judge it early.

---

## Key Insight: This Is a Human-AI Collaboration

Human cognition is best used for critical thinking, spotting mistakes, preventing repeating patterns, and setting guardrails. AI cognition is best used for executing on well-defined instructions, analyzing patterns from recent context, and writing structured documentation.

The self-improvement loop doesn't run on its own — **you** supply the critical observation ("that was wrong") and **Claude** does the reflection, abstraction, and writing. The division of labor is what makes it scale.

---

## Full File Reference

```
your-project/
├── CLAUDE.md                          ← Add META section
├── docs/
│   └── LEARNINGS.md                   ← New: persistent discovery log
├── .claude/
│   ├── MEMORY.md                      ← Auto-managed by Claude
│   ├── settings.json                  ← Add Stop hook
│   ├── hooks/
│   │   └── session-end-reflect.sh     ← New: auto-trigger reflection
│   └── commands/
│       ├── reflect.md                 ← New: on-demand reflection
│       └── post-mortem.md             ← New: failed session diagnosis
└── .planning/                         ← GSD plans (already exist)
    ├── 01-RESEARCH.md
    └── 01-1-PLAN.md
```
