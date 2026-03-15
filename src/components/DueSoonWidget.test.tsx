import { describe, it } from 'vitest'

describe('getDueSoonItems', () => {
  it.todo('returns items with deadline within 7 days (not completed)')
  it.todo('excludes completed items even if deadline is within 7 days')
  it.todo('excludes items with deadline more than 7 days away')
  it.todo('returns items sorted by daysRemaining ascending')
})

describe('DueSoonWidget', () => {
  it.todo('renders nothing when items array is empty')
  it.todo('renders due-soon item with category name, task text, days remaining')
  it.todo('calls onHighlight with category name on mouse enter')
  it.todo('calls onHighlight with null on mouse leave')
})
