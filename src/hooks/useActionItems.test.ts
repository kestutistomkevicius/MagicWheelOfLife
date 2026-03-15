// src/hooks/useActionItems.test.ts
// Wave 0: stubs only. Implementation in 03-03-PLAN.md.
import { describe, it } from 'vitest'

describe('useActionItems', () => {
  describe('addActionItem', () => {
    it.todo('returns error when currentCount >= 7 (ACTION-01 limit)')
    it.todo('returns ActionItemRow on successful insert (ACTION-01)')
  })

  describe('setDeadline', () => {
    it.todo('sends null to Supabase when value is empty string (ACTION-02 pitfall)')
    it.todo('sends ISO date string when value is set (ACTION-02)')
  })

  describe('toggleActionItem', () => {
    it.todo('calls Supabase update with negated is_complete value (ACTION-03)')
  })

  describe('deleteActionItem', () => {
    it.todo('calls Supabase DELETE with the correct item id (ACTION-04)')
  })
})
