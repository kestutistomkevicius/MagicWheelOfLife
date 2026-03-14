import { describe, it } from 'vitest'

describe('useWheel', () => {
  describe('loading wheel', () => {
    it.todo('returns loading=true initially then loading=false after fetch')
    it.todo('returns wheel and categories when user has an existing wheel')
    it.todo('returns wheel=null when user has no wheels')
  })

  describe('createWheel - template (WHEEL-01)', () => {
    it.todo('inserts a wheel row and 8 default categories when mode is template')
    it.todo('returns the new wheel id after creation')
  })

  describe('createWheel - blank (WHEEL-02)', () => {
    it.todo('inserts a wheel row with 0 categories when mode is blank')
  })

  describe('tier enforcement (WHEEL-06, WHEEL-07)', () => {
    it.todo('returns canCreateWheel=false when free-tier user already has 1 wheel')
    it.todo('returns canCreateWheel=true when premium-tier user already has 1 wheel')
  })
})
