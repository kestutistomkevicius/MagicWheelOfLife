import { describe, it } from 'vitest'

describe('TrendPage', () => {
  it.todo('shows empty state message when fewer than 3 snapshots exist')
  it.todo('shows snapshot count in empty state message')
  it.todo('renders TrendChart when 3 or more snapshots exist')
  it.todo('shows category select when snapshots exist')
  it.todo('category select lists all unique category names from snapshot scores')
  it.todo('chart data is in chronological order (oldest snapshot leftmost)')
  it.todo('omits chart points for categories with no score in that snapshot (does not plot as 0)')
})
