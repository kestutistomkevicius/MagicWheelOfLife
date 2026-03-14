import { describe, it } from 'vitest'

describe('useCategories', () => {
  describe('addCategory (WHEEL-03)', () => {
    it.todo('inserts a new category and returns updated list')
    it.todo('blocks insertion when category count is already 12')
    it.todo('assigns next sequential position to new category')
  })

  describe('renameCategory (WHEEL-04)', () => {
    it.todo('updates category name in Supabase')
    it.todo('calls onSnapshotWarning callback before rename when hasSnapshots is true')
    it.todo('proceeds without warning when hasSnapshots is false')
  })

  describe('removeCategory (WHEEL-05)', () => {
    it.todo('deletes category from Supabase')
    it.todo('blocks deletion when category count is already 3')
    it.todo('calls onSnapshotWarning callback before remove when hasSnapshots is true')
  })
})
