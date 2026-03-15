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
  TrendChart: ({ data, categoryName }: { data: unknown[]; categoryName: string }) => (
    <div data-testid="trend-chart" data-points={data.length} data-category={categoryName} />
  ),
}))

const { mockListSnapshots, mockFetchScores, mockWheel } = vi.hoisted(() => {
  const mockListSnapshots = vi.fn()
  const mockFetchScores = vi.fn()
  const mockWheel = { id: 'wheel-1', name: 'My Wheel', user_id: 'user-1', created_at: '', updated_at: '' }
  return { mockListSnapshots, mockFetchScores, mockWheel }
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
  useWheel: () => ({
    wheel: mockWheel,
    loading: false,
    wheels: [mockWheel],
    categories: [],
    setCategories: vi.fn(),
    error: null,
    canCreateWheel: false,
    selectWheel: vi.fn(),
    createWheel: vi.fn(),
    updateScore: vi.fn(),
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

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
