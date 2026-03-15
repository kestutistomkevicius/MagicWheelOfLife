// src/components/ActionItemList.test.tsx
// Wave 0: stubs only. Implementation in 03-04-PLAN.md.
import { describe, it } from 'vitest'

describe('ActionItemList', () => {
  describe('ACTION-01: add item', () => {
    it.todo('renders "+ Add action item" button when item count < 7')
    it.todo('does NOT render add button when item count = 7')
    it.todo('adds item to list after pressing Enter in input')
  })

  describe('ACTION-02: deadline', () => {
    it.todo('renders date input for each item')
    it.todo('shows empty date input when deadline is null')
    it.todo('shows ISO date value when deadline is set')
  })

  describe('ACTION-03: complete toggle', () => {
    it.todo('renders Checkbox checked when item.is_complete is true')
    it.todo('item text has line-through class when is_complete is true')
    it.todo('calls toggleActionItem when Checkbox is clicked')
  })

  describe('ACTION-04: delete', () => {
    it.todo('removes item from list immediately on delete click (optimistic)')
    it.todo('calls deleteActionItem with correct id')
  })
})
