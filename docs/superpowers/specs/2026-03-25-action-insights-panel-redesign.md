# Spec: ActionInsightsPanel Redesign

**Date:** 2026-03-25
**Status:** Approved
**Scope:** `src/components/ActionInsightsPanel.tsx` and its test file

---

## Problem

The current `ActionInsightsPanel` renders action items as plain bulleted lists (active and completed sections). It also renders multiple stacked green improvement-interval cards, each containing a repeated list of completed items. Users want a proper table with all relevant fields visible at a glance.

---

## Design

### 1. Latest wins card (optional)

- Show **at most one** green card — the most recent improvement interval from `improvementActions[0]`.
- Card content: headline only — `"Between {fromLabel} and {toLabel} your score improved by +{scoreDelta}"`.
- No inline item list inside the card.
- If `improvementActions` is empty, no card is shown.

### 2. Action items table

A single unified table replaces the two bulleted lists. Columns:

| Column | Source field | Null fallback | Display format |
|--------|-------------|---------------|----------------|
| Task | `item.text` | n/a (always set) | plain text |
| Due | `item.deadline` | render `—` | render as-is (`YYYY-MM-DD`) |
| Completed | `item.completed_at` | render `—` | `completed_at.slice(0, 10)` → `YYYY-MM-DD` |
| Status | `item.is_complete` | n/a (boolean) | badge: `false` → amber "Active", `true` → green "Done" |

`is_complete` is the sole authoritative field for badge rendering and row styling. `completed_at` is display-only; mismatches between the two are ignored.

**Row ordering:** the component partitions `allItems` into `active = items where is_complete === false` and `completed = items where is_complete === true`, preserving input order within each group. Renders active rows first, then completed rows.

**Active rows:** normal text and opacity, amber "Active" badge.

**Completed rows:** `opacity-60`, strikethrough on task text, green "Done" badge.

**Empty state:** both `allItems` (`ActionItemRow[]`, always an array, never null/undefined) and `improvementActions` (`ImprovementInterval[]`, always an array) are provided by the caller. Render `null` only when `allItems.length === 0` AND `improvementActions.length === 0`. Otherwise render whichever sections have content (card, table, or both).

**Guard:** only access `improvementActions[0]` after confirming `improvementActions.length > 0`.

---

## Component interface (unchanged)

```ts
interface ActionInsightsPanelProps {
  improvementActions: ImprovementInterval[]  // only [0] used now
  allItems: ActionItemRow[]
}
```

`ImprovementInterval.items` is no longer rendered (field can stay for now — unused).

---

## Files changed

- `src/components/ActionInsightsPanel.tsx` — implement design above
- `src/components/ActionInsightsPanel.test.tsx` — update tests to match new rendering

---

## Out of scope

- Sorting or filtering the table
- Making the table interactive (no inline completion toggling)
- Any other page or component
