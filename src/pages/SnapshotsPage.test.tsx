import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

// ── Hoisted mock variables ──────────────────────────────────────────────────

const mockListSnapshots = vi.hoisted(() => vi.fn())
const mockSaveSnapshot = vi.hoisted(() => vi.fn())
const mockFetchSnapshotScores = vi.hoisted(() => vi.fn())
const mockCheckSnapshotsExist = vi.hoisted(() => vi.fn())

// ── Mock hooks ──────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: 'user-1' } },
    signOut: vi.fn(),
  })),
}))

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn(() => ({
    listSnapshots: mockListSnapshots,
    saveSnapshot: mockSaveSnapshot,
    fetchSnapshotScores: mockFetchSnapshotScores,
    checkSnapshotsExist: mockCheckSnapshotsExist,
  })),
}))

vi.mock('@/hooks/useWheel', () => ({
  useWheel: vi.fn(() => ({
    wheel: { id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '' },
    wheels: [{ id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '' }],
    categories: [
      { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 7, created_at: '', updated_at: '' },
      { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 8, created_at: '', updated_at: '' },
    ],
    setCategories: vi.fn(),
    loading: false,
    error: null,
    canCreateWheel: true,
    selectWheel: vi.fn(),
    createWheel: vi.fn(),
    updateScore: vi.fn(),
  })),
}))

// Mock ComparisonChart to avoid Recharts SVG issues in jsdom
vi.mock('@/components/ComparisonChart', () => ({
  ComparisonChart: ({
    snap1Label,
    snap2Label,
  }: {
    snap1Label: string
    snap2Label: string
  }) => (
    <div data-testid="comparison-chart" data-snap1={snap1Label} data-snap2={snap2Label}>
      ComparisonChart
    </div>
  ),
}))

// Mock SnapshotNameDialog — shadcn Dialog Radix portals don't work in jsdom
vi.mock('@/components/SnapshotNameDialog', () => ({
  SnapshotNameDialog: ({
    open,
    onSave,
    onOpenChange,
  }: {
    open: boolean
    onSave: (name: string) => Promise<void>
    onOpenChange: (open: boolean) => void
    isSaving: boolean
  }) =>
    open ? (
      <div data-testid="snapshot-name-dialog">
        <button onClick={() => void onSave('Test Snapshot')}>Confirm Save</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}))

// ── Test data ───────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<SnapshotRow> & { id: string }): SnapshotRow {
  return {
    wheel_id: 'wheel-1',
    user_id: 'user-1',
    name: 'Test Snapshot',
    saved_at: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

function makeScore(overrides: Partial<SnapshotScoreRow> & { category_name: string }): SnapshotScoreRow {
  return {
    id: `score-${overrides.category_name}`,
    snapshot_id: 'snap-1',
    user_id: 'user-1',
    position: 0,
    score_asis: 5,
    score_tobe: 7,
    ...overrides,
  }
}

const snap1 = makeSnapshot({ id: 'snap-1', name: 'Q1 Review', saved_at: '2026-01-15T10:00:00Z' })
const snap2 = makeSnapshot({ id: 'snap-2', name: 'Q2 Review', saved_at: '2026-04-15T10:00:00Z' })

const snap1Scores = [
  makeScore({ category_name: 'Health', position: 0, score_asis: 5, score_tobe: 7, snapshot_id: 'snap-1', id: 'score-1a' }),
  makeScore({ category_name: 'Career', position: 1, score_asis: 6, score_tobe: 8, snapshot_id: 'snap-1', id: 'score-1b' }),
]
const snap2Scores = [
  makeScore({ category_name: 'Health', position: 0, score_asis: 7, score_tobe: 9, snapshot_id: 'snap-2', id: 'score-2a' }),
  makeScore({ category_name: 'Career', position: 1, score_asis: 8, score_tobe: 9, snapshot_id: 'snap-2', id: 'score-2b' }),
]

// ── Import after mocks ──────────────────────────────────────────────────────

import { SnapshotsPage } from '@/pages/SnapshotsPage'
import React from 'react'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SnapshotsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: two snapshots loaded
    mockListSnapshots.mockResolvedValue([snap2, snap1]) // DESC order from API
    mockFetchSnapshotScores.mockImplementation((snapshotId: string) => {
      if (snapshotId === 'snap-1') return Promise.resolve(snap1Scores)
      if (snapshotId === 'snap-2') return Promise.resolve(snap2Scores)
      return Promise.resolve([])
    })
    mockSaveSnapshot.mockResolvedValue(snap1)
    mockCheckSnapshotsExist.mockResolvedValue(true)
  })

  it('renders snapshot list with name and formatted date for each snapshot (SNAP-02)', async () => {
    render(<SnapshotsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Q1 Review').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Q2 Review').length).toBeGreaterThan(0)
    })

    // Dates should be formatted in en-GB style (e.g. "15 Jan 2026")
    expect(screen.getAllByText(/15 Jan 2026/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/15 Apr 2026/i).length).toBeGreaterThan(0)
  })

  it('shows empty state when no snapshots exist', async () => {
    mockListSnapshots.mockResolvedValue([])
    render(<SnapshotsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no snapshots yet/i)).toBeInTheDocument()
    })
  })

  it('selecting two snapshots reveals the ComparisonChart (COMP-01)', async () => {
    render(<SnapshotsPage />)

    // Wait for snapshots to load (list items appear)
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
    })

    // Initially no comparison chart
    expect(screen.queryByTestId('comparison-chart')).not.toBeInTheDocument()

    // Select first snapshot
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Still no chart with only 1 selected
    expect(screen.queryByTestId('comparison-chart')).not.toBeInTheDocument()

    // Select second snapshot
    fireEvent.click(checkboxes[1])

    // ComparisonChart should now appear
    await waitFor(() => {
      expect(screen.getByTestId('comparison-chart')).toBeInTheDocument()
    })
  })

  it('deselecting one of two snapshots hides the ComparisonChart', async () => {
    render(<SnapshotsPage />)

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
    })

    const checkboxes = screen.getAllByRole('checkbox')
    // Select two
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])

    await waitFor(() => {
      expect(screen.getByTestId('comparison-chart')).toBeInTheDocument()
    })

    // Deselect one
    fireEvent.click(checkboxes[0])

    await waitFor(() => {
      expect(screen.queryByTestId('comparison-chart')).not.toBeInTheDocument()
    })
  })

  it('score history table shows as-is and to-be for the selected category across all snapshots (COMP-02)', async () => {
    render(<SnapshotsPage />)

    // Wait for history scores to load (combobox appears)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Score history section should be visible (snapshots exist)
    const categorySelect = screen.getByRole('combobox')
    expect(categorySelect).toBeInTheDocument()

    // Table should show rows for each snapshot (as-is and to-be columns)
    // With default category selected, each snapshot row should show scores
    const rows = screen.getAllByRole('row')
    // rows[0] = header, rows[1..] = snapshot score rows
    expect(rows.length).toBeGreaterThan(1)
  })

  it('shows onboarding callout when no snapshots exist', async () => {
    mockListSnapshots.mockResolvedValue([])
    render(<SnapshotsPage />)

    await waitFor(() => {
      expect(screen.getByText('What is a snapshot?')).toBeInTheDocument()
    })
  })

  it('does not show onboarding callout when snapshots exist', async () => {
    // Default mock already returns snap1 and snap2
    render(<SnapshotsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Q1 Review').length).toBeGreaterThan(0)
    })

    expect(screen.queryByText('What is a snapshot?')).not.toBeInTheDocument()
  })

  it('category select is populated with unique category names from all snapshots', async () => {
    render(<SnapshotsPage />)

    // Wait for all snapshot scores to load (category select gets options)
    await waitFor(() => {
      const categorySelect = screen.getByRole('combobox')
      const options = Array.from(categorySelect.querySelectorAll('option'))
      expect(options.length).toBeGreaterThan(0)
    })

    const categorySelect = screen.getByRole('combobox')
    // Health and Career are in the score data
    const options = Array.from(categorySelect.querySelectorAll('option'))
    const optionValues = options.map(o => o.textContent)
    expect(optionValues).toContain('Health')
    expect(optionValues).toContain('Career')
  })
})
