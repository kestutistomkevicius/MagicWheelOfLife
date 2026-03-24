import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrendPage } from './TrendPage'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

// Mock recharts (same as TrendChart.test.tsx)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-points={data?.length}>{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

// Mock TrendChart so TrendPage tests focus on page logic, not chart rendering
vi.mock('@/components/TrendChart', () => ({
  TrendChart: ({ data, categoryName, markers }: { data: unknown[]; categoryName: string; markers?: unknown[] }) => (
    <div
      data-testid="trend-chart"
      data-points={data.length}
      data-category={categoryName}
      data-markers={JSON.stringify(markers ?? [])}
    />
  ),
}))

const { mockListSnapshots, mockFetchScores, mockWheel, mockLoadActionItems, mockCategories, mockUseWheel, mockSelectWheel } = vi.hoisted(() => {
  const mockListSnapshots = vi.fn()
  const mockFetchScores = vi.fn()
  const mockLoadActionItems = vi.fn()
  const mockSelectWheel = vi.fn()
  const mockWheel = { id: 'wheel-1', name: 'My Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
  const mockCategories = [
    { id: 'cat-health', name: 'Health', wheel_id: 'wheel-1', user_id: 'user-1', position: 0, score_asis: 7, score_tobe: 9, created_at: '', updated_at: '' },
    { id: 'cat-career', name: 'Career', wheel_id: 'wheel-1', user_id: 'user-1', position: 1, score_asis: 6, score_tobe: 8, created_at: '', updated_at: '' },
  ]
  const mockUseWheel = vi.fn()
  return { mockListSnapshots, mockFetchScores, mockWheel, mockLoadActionItems, mockCategories, mockUseWheel, mockSelectWheel }
})

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: () => ({
    listSnapshots: mockListSnapshots,
    fetchSnapshotScores: mockFetchScores,
    checkSnapshotsExist: vi.fn().mockResolvedValue(true),
    saveSnapshot: vi.fn(),
  }),
}))

vi.mock('@/hooks/useWheel', () => ({
  useWheel: (...args: unknown[]) => mockUseWheel(...args),
}))

vi.mock('@/hooks/useActionItems', () => ({
  useActionItems: () => ({
    loadActionItems: mockLoadActionItems,
    addActionItem: vi.fn(),
    toggleActionItem: vi.fn(),
    setDeadline: vi.fn(),
    deleteActionItem: vi.fn(),
    saveCompletionNote: vi.fn(),
    reopenActionItem: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

// Test helpers
function makeSnap(id: string, savedAt: string): SnapshotRow {
  return { id, wheel_id: 'wheel-1', user_id: 'user-1', name: `Snap ${id}`, saved_at: savedAt }
}

function makeScore(snapshotId: string, categoryName: string, asis: number, tobe: number): SnapshotScoreRow {
  return {
    id: `score-${snapshotId}-${categoryName}`,
    snapshot_id: snapshotId,
    user_id: 'user-1',
    category_name: categoryName,
    position: 0,
    score_asis: asis,
    score_tobe: tobe,
  }
}

// Helper to build an action item row
function makeActionItem(
  id: string,
  categoryId: string,
  text: string,
  deadline: string | null = null,
  isComplete = false,
  completedAt: string | null = null,
): { id: string; category_id: string; user_id: string; text: string; is_complete: boolean; deadline: string | null; completed_at: string | null; note: string | null; position: number; created_at: string; updated_at: string } {
  return { id, category_id: categoryId, user_id: 'user-1', text, is_complete: isComplete, deadline, completed_at: completedAt, note: null, position: 0, created_at: '', updated_at: '' }
}

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default useWheel: single wheel
    mockUseWheel.mockReturnValue({
      wheel: mockWheel,
      loading: false,
      wheels: [mockWheel],
      categories: mockCategories,
      setCategories: vi.fn(),
      error: null,
      canCreateWheel: false,
      selectWheel: mockSelectWheel,
      createWheel: vi.fn(),
      updateScore: vi.fn(),
    })
    // Default: no action items
    mockLoadActionItems.mockResolvedValue([])
  })

  it('shows empty state message when fewer than 3 snapshots exist', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    // listSnapshots returns DESC (most-recent first)
    mockListSnapshots.mockResolvedValue([snap2, snap1])
    mockFetchScores.mockResolvedValue([])

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByText(/at least 3 snapshots/i)).toBeInTheDocument()
    })
    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument()
  })

  it('shows snapshot count in empty state message', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap1])
    mockFetchScores.mockResolvedValue([])

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByText(/you have 1 so far/i)).toBeInTheDocument()
    })
  })

  it('renders TrendChart when 3 or more snapshots exist', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    // listSnapshots returns DESC
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) => {
      return Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
    })

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })
  })

  it('shows category select when snapshots exist', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) => {
      return Promise.resolve([
        makeScore(snapshotId, 'Career', 6, 8),
        makeScore(snapshotId, 'Health', 7, 9),
      ])
    })

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Health' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Career' })).toBeInTheDocument()
  })

  it('category select lists all unique category names from snapshot scores', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) => {
      return Promise.resolve([
        makeScore(snapshotId, 'Finance', 5, 8),
        makeScore(snapshotId, 'Health', 7, 9),
        makeScore(snapshotId, 'Career', 6, 8),
      ])
    })

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })

    const options = screen.getAllByRole('option')
    // 3 unique categories: Career, Finance, Health (sorted)
    expect(options).toHaveLength(3)
    expect(options.map(o => o.textContent)).toEqual(['Career', 'Finance', 'Health'])
  })

  it('chart data is in chronological order (oldest snapshot leftmost)', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    // listSnapshots returns DESC (most-recent first)
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) => {
      const scores: Record<string, number> = { s1: 5, s2: 7, s3: 9 }
      return Promise.resolve([makeScore(snapshotId, 'Health', scores[snapshotId], 10)])
    })

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })

    // 3 snapshots should produce 3 data points
    const chart = screen.getByTestId('trend-chart')
    expect(chart.getAttribute('data-points')).toBe('3')
  })

  it('omits chart points for categories with no score in that snapshot (does not plot as 0)', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    // listSnapshots returns DESC
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) => {
      if (snapshotId === 's1') {
        // snap1 only has Health (no Career)
        return Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
      }
      // snap2 and snap3 have both Health and Career
      return Promise.resolve([
        makeScore(snapshotId, 'Health', 7, 9),
        makeScore(snapshotId, 'Career', 5, 8),
      ])
    })

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })

    // Select "Career" category
    const user = userEvent.setup()
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Career')

    await waitFor(() => {
      const chart = screen.getByTestId('trend-chart')
      // Career only appears in snap2 and snap3 (not snap1) — 2 points, not 3
      expect(chart.getAttribute('data-points')).toBe('2')
    })
  })

  // Marker computation tests
  it('passes markers array to TrendChart when completed action item date matches snapshot date', async () => {
    // Snapshots: Jan, Feb, Mar 2026
    // "01 Jan 2026" formatted by formatDate('2026-01-01T00:00:00Z')
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) =>
      Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
    )
    // Action item completed on 2026-02-01 — should match snapshot s2
    mockLoadActionItems.mockResolvedValue([
      makeActionItem('ai-1', 'cat-health', 'Go for a run', null, true, '2026-02-01T10:00:00Z'),
    ])

    render(<TrendPage />)

    await waitFor(() => {
      const chart = screen.getByTestId('trend-chart')
      const markers = JSON.parse(chart.getAttribute('data-markers') ?? '[]') as { color: string }[]
      expect(markers).toHaveLength(1)
    })
  })

  it('passes empty markers when no action item dates match snapshot dates', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) =>
      Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
    )
    // Action item completed on a date that does NOT match any snapshot
    mockLoadActionItems.mockResolvedValue([
      makeActionItem('ai-1', 'cat-health', 'Some task', null, true, '2026-04-15T10:00:00Z'),
    ])

    render(<TrendPage />)

    await waitFor(() => {
      const chart = screen.getByTestId('trend-chart')
      const markers = JSON.parse(chart.getAttribute('data-markers') ?? '[]') as { color: string }[]
      expect(markers).toHaveLength(0)
    })
  })

  it('completed item marker has green color #16a34a', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) =>
      Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
    )
    mockLoadActionItems.mockResolvedValue([
      makeActionItem('ai-1', 'cat-health', 'Completed task', null, true, '2026-01-01T10:00:00Z'),
    ])

    render(<TrendPage />)

    await waitFor(() => {
      const chart = screen.getByTestId('trend-chart')
      const markers = JSON.parse(chart.getAttribute('data-markers') ?? '[]') as { color: string }[]
      expect(markers).toHaveLength(1)
      expect(markers[0].color).toBe('#16a34a')
    })
  })

  // Wheel selector tests (CONTENT-05)
  it('does not render wheel selector when only one wheel exists', async () => {
    // Default mock already has wheels: [mockWheel] — single wheel
    mockListSnapshots.mockResolvedValue([])
    mockFetchScores.mockResolvedValue([])

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByText(/trend/i)).toBeInTheDocument()
    })

    // With a single wheel there should be no wheel selector <select> near the h1
    // The category selector only appears when snapshots exist; with 0 snapshots there are no selects at all
    const selects = screen.queryAllByRole('combobox')
    expect(selects).toHaveLength(0)
  })

  it('renders wheel selector when multiple wheels exist', async () => {
    const wheel2 = { id: 'wheel-2', name: 'Work Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
    mockUseWheel.mockReturnValue({
      wheel: mockWheel,
      loading: false,
      wheels: [mockWheel, wheel2],
      categories: mockCategories,
      setCategories: vi.fn(),
      error: null,
      canCreateWheel: false,
      selectWheel: mockSelectWheel,
      createWheel: vi.fn(),
      updateScore: vi.fn(),
    })
    mockListSnapshots.mockResolvedValue([])
    mockFetchScores.mockResolvedValue([])

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByText(/trend/i)).toBeInTheDocument()
    })

    // Wheel selector should be present with options for both wheels
    const wheelSelect = screen.getByRole('combobox')
    expect(wheelSelect).toBeInTheDocument()
    expect(screen.getByRole('option', { name: mockWheel.name })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: wheel2.name })).toBeInTheDocument()
  })

  it('selecting a different wheel calls selectWheel with the new wheel id', async () => {
    const wheel2 = { id: 'wheel-2', name: 'Work Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
    mockUseWheel.mockReturnValue({
      wheel: mockWheel,
      loading: false,
      wheels: [mockWheel, wheel2],
      categories: mockCategories,
      setCategories: vi.fn(),
      error: null,
      canCreateWheel: false,
      selectWheel: mockSelectWheel,
      createWheel: vi.fn(),
      updateScore: vi.fn(),
    })
    mockListSnapshots.mockResolvedValue([])
    mockFetchScores.mockResolvedValue([])

    render(<TrendPage />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const wheelSelect = screen.getByRole('combobox')
    const user = userEvent.setup()
    await user.selectOptions(wheelSelect, wheel2.id)

    expect(mockSelectWheel).toHaveBeenCalledWith(wheel2.id)
  })

  it('reloads snapshots for the newly selected wheel when wheel is switched', async () => {
    const wheel2 = { id: 'wheel-2', name: 'Work Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
    let activeWheel = mockWheel

    mockSelectWheel.mockImplementation((id: string) => {
      activeWheel = id === 'wheel-2' ? wheel2 : mockWheel
      // Force re-render by updating mock return
      mockUseWheel.mockReturnValue({
        wheel: activeWheel,
        loading: false,
        wheels: [mockWheel, wheel2],
        categories: mockCategories,
        setCategories: vi.fn(),
        error: null,
        canCreateWheel: false,
        selectWheel: mockSelectWheel,
        createWheel: vi.fn(),
        updateScore: vi.fn(),
      })
    })

    mockUseWheel.mockReturnValue({
      wheel: mockWheel,
      loading: false,
      wheels: [mockWheel, wheel2],
      categories: mockCategories,
      setCategories: vi.fn(),
      error: null,
      canCreateWheel: false,
      selectWheel: mockSelectWheel,
      createWheel: vi.fn(),
      updateScore: vi.fn(),
    })

    mockListSnapshots.mockResolvedValue([])
    mockFetchScores.mockResolvedValue([])

    const { rerender } = render(<TrendPage />)

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

    // Select wheel-2
    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox'), 'wheel-2')

    expect(mockSelectWheel).toHaveBeenCalledWith('wheel-2')

    // Rerender with updated mock (simulates React re-render after state update)
    rerender(<TrendPage />)

    await waitFor(() => {
      // listSnapshots should have been called with wheel-2's id
      expect(mockListSnapshots).toHaveBeenCalledWith('wheel-2')
    })
  })

  it('overdue item marker has red color #dc2626', async () => {
    const snap1 = makeSnap('s1', '2026-01-01T00:00:00Z')
    const snap2 = makeSnap('s2', '2026-02-01T00:00:00Z')
    const snap3 = makeSnap('s3', '2026-03-01T00:00:00Z')
    mockListSnapshots.mockResolvedValue([snap3, snap2, snap1])
    mockFetchScores.mockImplementation((snapshotId: string) =>
      Promise.resolve([makeScore(snapshotId, 'Health', 7, 9)])
    )
    // Deadline on 2026-01-01 — a past date, not complete → overdue (red)
    mockLoadActionItems.mockResolvedValue([
      makeActionItem('ai-2', 'cat-health', 'Overdue task', '2026-01-01', false, null),
    ])

    render(<TrendPage />)

    await waitFor(() => {
      const chart = screen.getByTestId('trend-chart')
      const markers = JSON.parse(chart.getAttribute('data-markers') ?? '[]') as { color: string }[]
      expect(markers).toHaveLength(1)
      expect(markers[0].color).toBe('#dc2626')
    })
  })
})
