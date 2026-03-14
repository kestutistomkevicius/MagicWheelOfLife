import { describe, it } from 'vitest'

describe('WheelPage', () => {
  describe('real-time chart update (SCORE-03)', () => {
    it.todo('updates chart data immediately when slider onChange fires — no Supabase call yet')
    it.todo('calls Supabase update only when slider onCommit fires (pointer up)')
  })

  describe('snapshot warning dialog (WHEEL-04, WHEEL-05)', () => {
    it.todo('shows AlertDialog before rename when wheel has existing snapshots')
    it.todo('skips AlertDialog and renames immediately when wheel has no snapshots')
    it.todo('shows AlertDialog before remove when wheel has existing snapshots')
    it.todo('skips AlertDialog and removes immediately when wheel has no snapshots')
  })

  describe('upgrade prompt (WHEEL-06, WHEEL-07)', () => {
    it.todo('shows upgrade prompt dialog when free-tier user clicks create wheel and already has one wheel')
    it.todo('opens create wheel modal when premium-tier user clicks create wheel and already has one wheel')
  })

  describe('category management', () => {
    it.todo('add category button is disabled when category count reaches 12')
    it.todo('remove category button is disabled when category count is 3')
  })
})
