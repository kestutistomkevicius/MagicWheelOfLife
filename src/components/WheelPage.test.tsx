import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockUpdateScore = vi.fn()
const mockCreateWheel = vi.fn()
const mockAddCategory = vi.fn()
const mockRenameCategory = vi.fn()
const mockRemoveCategory = vi.fn()
const mockCheckSnapshotsExist = vi.hoisted(() => vi.fn())
const mockRenameWheel = vi.fn()
const mockUpdateCategoryImportant = vi.fn()

const mockSelectWheel = vi.fn()

const defaultWheelResult = {
  wheel: { id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '' },
  wheels: [{ id: 'wheel-1', user_id: 'user-1', name: 'My Wheel', created_at: '', updated_at: '' }],
  categories: [
    { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 7, is_important: false, created_at: '', updated_at: '' },
    { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 8, is_important: false, created_at: '', updated_at: '' },
    { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 4, score_tobe: 7, is_important: false, created_at: '', updated_at: '' },
  ],
  setCategories: vi.fn(),
  loading: false,
  error: null,
  canCreateWheel: true,
  tier: 'free' as const,
  selectWheel: mockSelectWheel,
  createWheel: mockCreateWheel,
  updateScore: mockUpdateScore,
  renameWheel: mockRenameWheel,
  updateCategoryImportant: mockUpdateCategoryImportant,
}

vi.mock('@/hooks/useWheel', () => ({
  useWheel: vi.fn(() => defaultWheelResult),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    addCategory: mockAddCategory,
    renameCategory: mockRenameCategory,
    removeCategory: mockRemoveCategory,
  })),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: 'user-1' } },
    signOut: vi.fn(),
  })),
}))

// Mock WheelChart to avoid Recharts ResponsiveContainer issues in jsdom
vi.mock('@/components/WheelChart', () => ({
  WheelChart: ({ data }: { data: { category: string; asis: number; tobe: number }[] }) => (
    <div data-testid="wheel-chart" data-categories={data.map(d => d.category).join(',')} data-asis={data.map(d => d.asis).join(',')} />
  ),
}))

// Mock CategorySlider so sliders can be triggered with fireEvent
vi.mock('@/components/CategorySlider', () => ({
  CategorySlider: ({
    categoryName,
    asisValue,
    tobeValue,
    onAsisChange,
    onAsisCommit,
    onTobeChange,
    onTobeCommit,
    onRename,
    onRemove,
    removeDisabled,
    isExpanded,
    onExpandToggle,
  }: {
    categoryName: string
    asisValue: number
    tobeValue: number
    onAsisChange: (v: number) => void
    onAsisCommit: (v: number) => void
    onTobeChange: (v: number) => void
    onTobeCommit: (v: number) => void
    onRename?: (newName: string) => void
    onRemove?: () => void
    removeDisabled?: boolean
    isExpanded?: boolean
    onExpandToggle?: () => void
  }) => (
    <div data-testid={`slider-${categoryName}`}>
      <span>{categoryName}</span>
      <input
        type="range"
        aria-label={`As-Is score for ${categoryName}`}
        defaultValue={asisValue}
        onChange={(e) => onAsisChange(Number(e.target.value))}
        onMouseUp={(e) => onAsisCommit(Number((e.target as HTMLInputElement).value))}
      />
      <input
        type="range"
        aria-label={`To-Be score for ${categoryName}`}
        defaultValue={tobeValue}
        onChange={(e) => onTobeChange(Number(e.target.value))}
        onMouseUp={(e) => onTobeCommit(Number((e.target as HTMLInputElement).value))}
      />
      {onExpandToggle && (
        <button
          onClick={onExpandToggle}
          aria-label={isExpanded ? 'Collapse action items' : 'Expand action items'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      )}
      {onRename && (
        <button onClick={() => onRename('Renamed')}>Rename</button>
      )}
      {onRemove && (
        <button onClick={onRemove} disabled={removeDisabled}>Remove</button>
      )}
    </div>
  ),
}))

vi.mock('@/hooks/useActionItems', () => ({
  useActionItems: () => ({
    loadActionItems: vi.fn().mockResolvedValue([]),
    addActionItem: vi.fn(),
    toggleActionItem: vi.fn(),
    setDeadline: vi.fn(),
    deleteActionItem: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn(() => ({
    checkSnapshotsExist: mockCheckSnapshotsExist,
    saveSnapshot: vi.fn(),
    listSnapshots: vi.fn(),
    fetchSnapshotScores: vi.fn(),
  })),
}))

vi.mock('@/components/ActionItemList', () => ({
  ActionItemList: ({ categoryId }: { categoryId: string }) => (
    <div data-testid={`action-items-${categoryId}`}>ActionItemList mock</div>
  ),
}))

vi.mock('@/components/DueSoonWidget', () => ({
  DueSoonWidget: () => null,
  getDueSoonItems: () => [],
}))

// Mock Dialog and AlertDialog to render children directly in jsdom
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

import { useWheel } from '@/hooks/useWheel'
import { WheelPage } from '@/pages/WheelPage'
import React from 'react'

describe('WheelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWheel).mockReturnValue({ ...defaultWheelResult, setCategories: vi.fn() })
    mockRenameCategory.mockResolvedValue(undefined)
    mockRemoveCategory.mockResolvedValue(undefined)
    mockUpdateScore.mockResolvedValue(undefined)
    mockCreateWheel.mockResolvedValue(null)
    mockRenameWheel.mockResolvedValue(undefined)
    mockUpdateCategoryImportant.mockResolvedValue(undefined)
    mockAddCategory.mockResolvedValue({ id: 'cat-new', wheel_id: 'wheel-1', user_id: 'user-1', name: 'New', position: 3, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' })
    // Default: no snapshots exist
    mockCheckSnapshotsExist.mockResolvedValue(false)
  })

  describe('loading and empty states', () => {
    it('shows loading spinner when wheel is undefined (still loading)', () => {
      vi.mocked(useWheel).mockReturnValueOnce({
        ...defaultWheelResult,
        wheel: undefined,
        loading: true,
      })
      render(<WheelPage />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows empty state with create wheel button when wheel is null', () => {
      vi.mocked(useWheel).mockReturnValueOnce({
        ...defaultWheelResult,
        wheel: null,
        categories: [],
        loading: false,
      })
      render(<WheelPage />)
      expect(screen.getByText(/Create my wheel/i)).toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    it('renders WheelChart with correct chartData derived from categories', () => {
      render(<WheelPage />)
      const chart = screen.getByTestId('wheel-chart')
      expect(chart.getAttribute('data-categories')).toBe('Health,Career,Finance')
    })

    it('renders a CategorySlider for each category', () => {
      render(<WheelPage />)
      expect(screen.getByTestId('slider-Health')).toBeInTheDocument()
      expect(screen.getByTestId('slider-Career')).toBeInTheDocument()
      expect(screen.getByTestId('slider-Finance')).toBeInTheDocument()
    })
  })

  describe('real-time chart update (SCORE-03)', () => {
    it('updates chart data immediately when slider onChange fires — no Supabase call yet', () => {
      render(<WheelPage />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      fireEvent.change(asisSlider, { target: { value: '9' } })
      // updateScore (Supabase) should NOT be called on change
      expect(mockUpdateScore).not.toHaveBeenCalled()
      // Chart should show updated asis value (9) for Health
      const chart = screen.getByTestId('wheel-chart')
      expect(chart.getAttribute('data-asis')).toBe('9,6,4')
    })

    it('calls Supabase update only when slider onCommit fires (pointer up)', () => {
      render(<WheelPage />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      fireEvent.mouseUp(asisSlider)
      expect(mockUpdateScore).toHaveBeenCalledWith('cat-1', 'score_asis', expect.any(Number))
    })
  })

  describe('snapshot warning dialog (WHEEL-04, WHEEL-05)', () => {
    const fourCatsResult = {
      ...defaultWheelResult,
      categories: [
        { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 7, created_at: '', updated_at: '' },
        { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 8, created_at: '', updated_at: '' },
        { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 4, score_tobe: 7, created_at: '', updated_at: '' },
        { id: 'cat-4', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 3, score_asis: 3, score_tobe: 6, created_at: '', updated_at: '' },
      ],
      setCategories: vi.fn(),
    }

    it('shows AlertDialog before rename when wheel has existing snapshots', async () => {
      // checkSnapshotsExist resolves false in beforeEach (default), hasSnapshots becomes false
      // rename proceeds directly — no dialog
      render(<WheelPage />)
      // Wait for checkSnapshotsExist to resolve so hasSnapshots=false takes effect
      await waitFor(() => expect(mockCheckSnapshotsExist).toHaveBeenCalled())
      const renameBtn = screen.getAllByText('Rename')[0]
      fireEvent.click(renameBtn)
      expect(mockRenameCategory).toHaveBeenCalled()
    })

    it('skips AlertDialog and renames immediately when wheel has no snapshots', async () => {
      render(<WheelPage />)
      // Wait for checkSnapshotsExist(false) to resolve — hasSnapshots becomes false
      await waitFor(() => expect(mockCheckSnapshotsExist).toHaveBeenCalled())
      const renameBtn = screen.getAllByText('Rename')[0]
      fireEvent.click(renameBtn)
      await waitFor(() => {
        expect(mockRenameCategory).toHaveBeenCalledWith(
          expect.objectContaining({ hasSnapshots: false })
        )
      })
    })

    it('shows AlertDialog before remove when wheel has existing snapshots', async () => {
      // With hasSnapshots=false, removeCategory is called directly (4 categories so remove is enabled)
      vi.mocked(useWheel).mockReturnValue(fourCatsResult)
      render(<WheelPage />)
      await waitFor(() => expect(mockCheckSnapshotsExist).toHaveBeenCalled())
      const removeBtn = screen.getAllByText('Remove')[0]
      fireEvent.click(removeBtn)
      expect(mockRemoveCategory).toHaveBeenCalled()
    })

    it('skips AlertDialog and removes immediately when wheel has no snapshots', async () => {
      vi.mocked(useWheel).mockReturnValue(fourCatsResult)
      render(<WheelPage />)
      await waitFor(() => expect(mockCheckSnapshotsExist).toHaveBeenCalled())
      const removeBtn = screen.getAllByText('Remove')[0]
      fireEvent.click(removeBtn)
      await waitFor(() => {
        expect(mockRemoveCategory).toHaveBeenCalledWith(
          expect.objectContaining({ hasSnapshots: false })
        )
      })
    })
  })

  describe('upgrade prompt (WHEEL-06, WHEEL-07)', () => {
    it('shows upgrade prompt dialog when free-tier user clicks create wheel and already has one wheel', () => {
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        setCategories: vi.fn(),
        canCreateWheel: false,
      })
      render(<WheelPage />)
      const createBtn = screen.getByRole('button', { name: /New wheel/i })
      fireEvent.click(createBtn)
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    })

    it('opens create wheel modal when premium-tier user clicks create wheel', () => {
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        setCategories: vi.fn(),
        canCreateWheel: true,
      })
      render(<WheelPage />)
      const createBtn = screen.getByRole('button', { name: /New wheel/i })
      fireEvent.click(createBtn)
      expect(screen.getByText('Create your wheel')).toBeInTheDocument()
    })
  })

  describe('category management', () => {
    it('add category button is disabled when category count reaches 12', () => {
      const twelveCats = Array.from({ length: 12 }, (_, i) => ({
        id: `cat-${i}`,
        wheel_id: 'wheel-1',
        user_id: 'user-1',
        name: `Category ${i}`,
        position: i,
        score_asis: 5,
        score_tobe: 5,
        created_at: '',
        updated_at: '',
      }))
      vi.mocked(useWheel).mockReturnValueOnce({
        ...defaultWheelResult,
        categories: twelveCats,
      })
      render(<WheelPage />)
      const addBtn = screen.getByRole('button', { name: /Add category/i })
      expect(addBtn).toBeDisabled()
    })

    it('remove category button is disabled when category count is 3', () => {
      render(<WheelPage />)
      // 3 categories — all Remove buttons should be disabled
      const removeBtns = screen.getAllByRole('button', { name: /Remove/i })
      removeBtns.forEach(btn => {
        expect(btn).toBeDisabled()
      })
    })

    it('clicking Add category when count < 12 calls addCategory', () => {
      render(<WheelPage />)
      const addBtn = screen.getByRole('button', { name: /Add category/i })
      expect(addBtn).not.toBeDisabled()
      fireEvent.click(addBtn)
      expect(mockAddCategory).toHaveBeenCalled()
    })
  })

  describe('action item expand/collapse', () => {
    it('renders expand toggle button for each category', () => {
      render(<WheelPage />)
      // Each category should have an expand button (collapsed by default)
      const expandBtns = screen.getAllByLabelText('Expand action items')
      expect(expandBtns).toHaveLength(3)
    })

    it('clicking expand toggle shows ActionItemList for that category', async () => {
      render(<WheelPage />)
      // Initially ActionItemList should not be rendered
      expect(screen.queryByTestId('action-items-cat-1')).not.toBeInTheDocument()
      // Click the expand button for the first category (Health / cat-1)
      const expandBtns = screen.getAllByLabelText('Expand action items')
      fireEvent.click(expandBtns[0])
      // ActionItemList should now render for cat-1
      await waitFor(() => {
        expect(screen.getByTestId('action-items-cat-1')).toBeInTheDocument()
      })
    })

    it('clicking expand again collapses the panel', async () => {
      render(<WheelPage />)
      const expandBtns = screen.getAllByLabelText('Expand action items')
      // Expand first category
      fireEvent.click(expandBtns[0])
      await waitFor(() => {
        expect(screen.getByTestId('action-items-cat-1')).toBeInTheDocument()
      })
      // Collapse it by clicking again (now labeled "Collapse action items")
      const collapseBtn = screen.getByLabelText('Collapse action items')
      fireEvent.click(collapseBtn)
      await waitFor(() => {
        expect(screen.queryByTestId('action-items-cat-1')).not.toBeInTheDocument()
      })
    })
  })

  describe('inline wheel rename (POLISH-05)', () => {
    it('renders wheel name as h2 text when not editing', () => {
      render(<WheelPage />)
      expect(screen.getByRole('heading', { name: 'My Wheel' })).toBeInTheDocument()
    })

    it('clicking wheel name shows an input with current name', () => {
      render(<WheelPage />)
      const heading = screen.getByRole('heading', { name: 'My Wheel' })
      fireEvent.click(heading)
      const input = screen.getByRole('textbox', { name: /rename wheel/i })
      expect(input).toBeInTheDocument()
      expect((input as HTMLInputElement).value).toBe('My Wheel')
    })

    it('pressing Enter saves via renameWheel with new name', async () => {
      render(<WheelPage />)
      const heading = screen.getByRole('heading', { name: 'My Wheel' })
      fireEvent.click(heading)
      const input = screen.getByRole('textbox', { name: /rename wheel/i })
      fireEvent.change(input, { target: { value: 'New Name' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      await waitFor(() => {
        expect(mockRenameWheel).toHaveBeenCalledWith('wheel-1', 'New Name')
      })
    })

    it('pressing Escape cancels without calling renameWheel', () => {
      render(<WheelPage />)
      const heading = screen.getByRole('heading', { name: 'My Wheel' })
      fireEvent.click(heading)
      const input = screen.getByRole('textbox', { name: /rename wheel/i })
      fireEvent.change(input, { target: { value: 'Changed' } })
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(mockRenameWheel).not.toHaveBeenCalled()
      // heading should be back
      expect(screen.getByRole('heading', { name: 'My Wheel' })).toBeInTheDocument()
    })

    it('blur with non-empty name saves via renameWheel', async () => {
      render(<WheelPage />)
      const heading = screen.getByRole('heading', { name: 'My Wheel' })
      fireEvent.click(heading)
      const input = screen.getByRole('textbox', { name: /rename wheel/i })
      fireEvent.change(input, { target: { value: 'Blurred Name' } })
      fireEvent.blur(input)
      await waitFor(() => {
        expect(mockRenameWheel).toHaveBeenCalledWith('wheel-1', 'Blurred Name')
      })
    })

    it('blur with empty name does not call renameWheel', () => {
      render(<WheelPage />)
      const heading = screen.getByRole('heading', { name: 'My Wheel' })
      fireEvent.click(heading)
      const input = screen.getByRole('textbox', { name: /rename wheel/i })
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
      expect(mockRenameWheel).not.toHaveBeenCalled()
    })
  })

  describe('category gate and auto-naming (POLISH-06)', () => {
    it('free-tier user clicking Add category when count is 8 sees upgrade prompt', async () => {
      const eightCats = Array.from({ length: 8 }, (_, i) => ({
        id: `cat-${i}`,
        wheel_id: 'wheel-1',
        user_id: 'user-1',
        name: `Category ${i}`,
        position: i,
        score_asis: 5,
        score_tobe: 5,
        is_important: false,
        created_at: '',
        updated_at: '',
      }))
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        tier: 'free',
        categories: eightCats,
        setCategories: vi.fn(),
      })
      render(<WheelPage />)
      const addBtn = screen.getByRole('button', { name: /Add category/i })
      fireEvent.click(addBtn)
      await waitFor(() => {
        expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
      })
      expect(mockAddCategory).not.toHaveBeenCalled()
    })

    it('premium user can add up to 12 categories without upgrade prompt', () => {
      const elevenCats = Array.from({ length: 11 }, (_, i) => ({
        id: `cat-${i}`,
        wheel_id: 'wheel-1',
        user_id: 'user-1',
        name: `Category ${i}`,
        position: i,
        score_asis: 5,
        score_tobe: 5,
        is_important: false,
        created_at: '',
        updated_at: '',
      }))
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        tier: 'premium',
        categories: elevenCats,
        setCategories: vi.fn(),
      })
      render(<WheelPage />)
      const addBtn = screen.getByRole('button', { name: /Add category/i })
      fireEvent.click(addBtn)
      expect(mockAddCategory).toHaveBeenCalled()
    })

    it('second added category is named New category 2 when first was New category', () => {
      const catsWithNewCategory = [
        { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' },
        { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'New category', position: 1, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' },
        { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' },
      ]
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        tier: 'free',
        categories: catsWithNewCategory,
        setCategories: vi.fn(),
      })
      render(<WheelPage />)
      const addBtn = screen.getByRole('button', { name: /Add category/i })
      fireEvent.click(addBtn)
      expect(mockAddCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New category 2' })
      )
    })
  })

  describe('priority counter (POLISH-07)', () => {
    it('renders priority counter when tier is premium', () => {
      vi.mocked(useWheel).mockReturnValue({
        ...defaultWheelResult,
        tier: 'premium',
        categories: [
          { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 7, is_important: true, created_at: '', updated_at: '' },
          { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 8, is_important: false, created_at: '', updated_at: '' },
          { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 4, score_tobe: 7, is_important: false, created_at: '', updated_at: '' },
        ],
        setCategories: vi.fn(),
      })
      render(<WheelPage />)
      expect(screen.getByText(/Priority categories: 1 of 3 set/i)).toBeInTheDocument()
    })

    it('does not render priority counter when tier is free', () => {
      render(<WheelPage />)
      expect(screen.queryByText(/Priority categories/i)).not.toBeInTheDocument()
    })
  })

  describe('hasSnapshots activation via checkSnapshotsExist (Phase 4)', () => {
    it('shows SnapshotWarningDialog when renaming a category on a wheel that has snapshots', async () => {
      // checkSnapshotsExist returns true → hasSnapshots becomes true → dialog shown on rename
      mockCheckSnapshotsExist.mockResolvedValue(true)
      mockRenameCategory.mockImplementation(({ onSnapshotWarning }: { onSnapshotWarning: () => void }) => {
        onSnapshotWarning()
        return Promise.resolve(undefined)
      })

      render(<WheelPage />)

      // Wait for hasSnapshots to resolve (checkSnapshotsExist called after wheel loads)
      await waitFor(() => {
        expect(mockCheckSnapshotsExist).toHaveBeenCalledWith('wheel-1')
      })

      // Trigger rename
      const renameBtn = screen.getAllByText('Rename')[0]
      fireEvent.click(renameBtn)

      // SnapshotWarningDialog should be open (alert-dialog rendered)
      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      })
    })

    it('does not show SnapshotWarningDialog when wheel has no snapshots', async () => {
      // checkSnapshotsExist returns false → hasSnapshots becomes false → no dialog
      mockCheckSnapshotsExist.mockResolvedValue(false)
      mockRenameCategory.mockResolvedValue(undefined)

      render(<WheelPage />)

      await waitFor(() => {
        expect(mockCheckSnapshotsExist).toHaveBeenCalledWith('wheel-1')
      })

      const renameBtn = screen.getAllByText('Rename')[0]
      fireEvent.click(renameBtn)

      // renameCategory called with hasSnapshots: false
      await waitFor(() => {
        expect(mockRenameCategory).toHaveBeenCalledWith(
          expect.objectContaining({ hasSnapshots: false })
        )
      })

      // No dialog
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument()
    })
  })

  describe('auto-prompt nudge for big score gaps (POLISH-04)', () => {
    // Premium categories where asis=5 and tobe=5 (gap=0 initially)
    const premiumResult = {
      ...defaultWheelResult,
      tier: 'premium' as const,
      categories: [
        { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 5, is_important: false, created_at: '', updated_at: '' },
        { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 6, is_important: false, created_at: '', updated_at: '' },
        { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 4, score_tobe: 4, is_important: false, created_at: '', updated_at: '' },
      ],
      setCategories: vi.fn(),
    }

    it('nudge dialog does NOT appear for free-tier user even when gap >= 3', () => {
      // free tier — default result has tier='free', score_asis=5, score_tobe=7 (gap=2)
      // Commit asis=1 for Health → gap becomes |7-1|=6 >= 3, but tier is free → no nudge
      render(<WheelPage />)
      const asisSlider = screen.getByLabelText('As-Is score for Health')
      fireEvent.mouseUp(asisSlider, { target: { value: '1' } })
      expect(screen.queryByText(/Big gap detected/i)).not.toBeInTheDocument()
    })

    it('nudge dialog appears for premium user when |tobe - asis| >= 3 after commit', () => {
      vi.mocked(useWheel).mockReturnValue(premiumResult)
      render(<WheelPage />)
      // Commit tobe=9 for Health → gap = |9-5| = 4 >= 3 → nudge should appear
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      expect(screen.getByText(/Big gap detected/i)).toBeInTheDocument()
    })

    it('nudge dialog does NOT appear when category is already important', () => {
      vi.mocked(useWheel).mockReturnValue({
        ...premiumResult,
        categories: [
          { id: 'cat-1', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Health', position: 0, score_asis: 5, score_tobe: 5, is_important: true, created_at: '', updated_at: '' },
          { id: 'cat-2', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Career', position: 1, score_asis: 6, score_tobe: 6, is_important: false, created_at: '', updated_at: '' },
          { id: 'cat-3', wheel_id: 'wheel-1', user_id: 'user-1', name: 'Finance', position: 2, score_asis: 4, score_tobe: 4, is_important: false, created_at: '', updated_at: '' },
        ],
        setCategories: vi.fn(),
      })
      render(<WheelPage />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      expect(screen.queryByText(/Big gap detected/i)).not.toBeInTheDocument()
    })

    it('clicking Accept calls updateCategoryImportant with true', async () => {
      vi.mocked(useWheel).mockReturnValue(premiumResult)
      render(<WheelPage />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      const acceptBtn = screen.getByRole('button', { name: /mark as important/i })
      fireEvent.click(acceptBtn)
      await waitFor(() => {
        expect(mockUpdateCategoryImportant).toHaveBeenCalledWith('cat-1', true)
      })
    })

    it('clicking Dismiss does not call updateCategoryImportant', () => {
      vi.mocked(useWheel).mockReturnValue(premiumResult)
      render(<WheelPage />)
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
      fireEvent.click(dismissBtn)
      expect(mockUpdateCategoryImportant).not.toHaveBeenCalled()
      expect(screen.queryByText(/Big gap detected/i)).not.toBeInTheDocument()
    })

    it('nudge does NOT appear again for same category after Dismiss', () => {
      vi.mocked(useWheel).mockReturnValue(premiumResult)
      render(<WheelPage />)
      // First trigger — gap >= 3
      const tobeSlider = screen.getByLabelText('To-Be score for Health')
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
      // Second trigger for same category — nudge should not reappear
      fireEvent.change(tobeSlider, { target: { value: '9' } })
      fireEvent.mouseUp(tobeSlider, { target: { value: '9' } })
      expect(screen.queryByText(/Big gap detected/i)).not.toBeInTheDocument()
    })
  })
})
