import { describe, it } from 'vitest'

describe('WheelPage', () => {
  describe('soft delete UI', () => {
    it.todo('shows Delete button on the active wheel')
    it.todo('clicking Delete calls softDeleteWheel with the wheel id')
    it.todo('shows "Deleting in ~10 min" suffix for soft-deleted wheels')
    it.todo('shows Undo button for soft-deleted wheels')
    it.todo('clicking Undo calls undoDeleteWheel with the wheel id')
    it.todo('shows "Recover a wheel" section when all wheels are soft-deleted')
  })
})
