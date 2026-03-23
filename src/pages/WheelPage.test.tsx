import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Hoisted mock variables ──────────────────────────────────────────────────

const mockSoftDeleteWheel = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUndoDeleteWheel = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockUseWheel = vi.hoisted(() => vi.fn())

// ── Mock hooks ───────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ session: { user: { id: 'user-1' } } })),
}))

vi.mock('@/hooks/useWheel', () => ({
  useWheel: mockUseWheel,
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    removeCategory: vi.fn(),
  })),
}))

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn(() => ({
    checkSnapshotsExist: vi.fn().mockResolvedValue(false),
  })),
}))

vi.mock('@/hooks/useActionItems', () => ({
  useActionItems: vi.fn(() => ({
    loadActionItems: vi.fn().mockResolvedValue([]),
    toggleActionItem: vi.fn(),
    saveCompletionNote: vi.fn(),
  })),
}))

vi.mock('@/contexts/PaletteContext', () => ({
  usePalette: vi.fn(() => ({ currentPalette: 'amber' })),
  PALETTES: {
    amber: {
      '--palette-primary': '#f59e0b',
      '--palette-secondary': '#fbbf24',
      '--palette-important': '#ef4444',
      '--palette-highlight': '#10b981',
    },
  },
}))

// ── Mock heavy components ────────────────────────────────────────────────────

vi.mock('@/components/WheelChart', () => ({
  WheelChart: () => <div data-testid="wheel-chart" />,
}))

vi.mock('@/components/CategorySlider', () => ({
  CategorySlider: ({ categoryName }: { categoryName: string }) => (
    <div data-testid={`slider-${categoryName}`} />
  ),
}))

vi.mock('@/components/ActionItemList', () => ({
  ActionItemList: () => <div data-testid="action-item-list" />,
}))

vi.mock('@/components/CreateWheelModal', () => ({
  CreateWheelModal: () => null,
}))

vi.mock('@/components/SnapshotWarningDialog', () => ({
  SnapshotWarningDialog: () => null,
}))

vi.mock('@/components/DueSoonWidget', () => ({
  DueSoonWidget: () => null,
  getDueSoonItems: vi.fn(() => []),
}))

vi.mock('@/components/AiCoachDrawer', () => ({
  AiCoachDrawer: () => null,
}))

// ── Import after mocks ───────────────────────────────────────────────────────

import { WheelPage } from '@/pages/WheelPage'
import React from 'react'

// ── Test data ────────────────────────────────────────────────────────────────

const mockWheel = {
  id: 'wheel-1',
  user_id: 'user-1',
  name: 'My Wheel',
  created_at: '',
  updated_at: '',
  deleted_at: null,
}

const mockCategories = [
  {
    id: 'cat-1',
    wheel_id: 'wheel-1',
    user_id: 'user-1',
    name: 'Health',
    position: 0,
    score_asis: 5,
    score_tobe: 7,
    created_at: '',
    updated_at: '',
    is_important: false,
  },
]

function makeDefaultWheelMock(overrides: Record<string, unknown> = {}) {
  return {
    wheel: mockWheel,
    wheels: [mockWheel],
    categories: mockCategories,
    setCategories: vi.fn(),
    loading: false,
    error: null,
    canCreateWheel: true,
    tier: 'free' as const,
    selectWheel: vi.fn(),
    createWheel: vi.fn(),
    updateScore: vi.fn(),
    renameWheel: vi.fn(),
    updateCategoryImportant: vi.fn(),
    softDeleteWheel: mockSoftDeleteWheel,
    undoDeleteWheel: mockUndoDeleteWheel,
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WheelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWheel.mockReturnValue(makeDefaultWheelMock())
  })

  describe('soft delete UI', () => {
    it('shows Delete button on the active wheel', () => {
      render(<WheelPage />)
      expect(screen.getByRole('button', { name: /delete this wheel/i })).toBeInTheDocument()
    })

    it('clicking Delete calls softDeleteWheel with the wheel id', () => {
      render(<WheelPage />)
      fireEvent.click(screen.getByRole('button', { name: /delete this wheel/i }))
      expect(mockSoftDeleteWheel).toHaveBeenCalledWith('wheel-1')
    })

    it('shows "Deleting in ~10 min" suffix for soft-deleted wheels', () => {
      const softDeletedWheel = { ...mockWheel, id: 'wheel-2', name: 'Old Wheel', deleted_at: '2026-01-01T00:00:00Z' }
      mockUseWheel.mockReturnValue(makeDefaultWheelMock({
        wheels: [mockWheel, softDeletedWheel],
      }))
      render(<WheelPage />)
      expect(screen.getByText(/deleting in ~10 min/i)).toBeInTheDocument()
    })

    it('shows Undo button for soft-deleted wheels', () => {
      const softDeletedWheel = { ...mockWheel, id: 'wheel-2', name: 'Old Wheel', deleted_at: '2026-01-01T00:00:00Z' }
      mockUseWheel.mockReturnValue(makeDefaultWheelMock({
        wheels: [mockWheel, softDeletedWheel],
      }))
      render(<WheelPage />)
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })

    it('clicking Undo calls undoDeleteWheel with the wheel id', () => {
      const softDeletedWheel = { ...mockWheel, id: 'wheel-2', name: 'Old Wheel', deleted_at: '2026-01-01T00:00:00Z' }
      mockUseWheel.mockReturnValue(makeDefaultWheelMock({
        wheels: [mockWheel, softDeletedWheel],
      }))
      render(<WheelPage />)
      fireEvent.click(screen.getByRole('button', { name: /undo/i }))
      expect(mockUndoDeleteWheel).toHaveBeenCalledWith('wheel-2')
    })

    it('shows "Recover a wheel" section when wheel=null and soft-deleted wheels exist', () => {
      const softDeletedWheel = { ...mockWheel, deleted_at: '2026-01-01T00:00:00Z' }
      mockUseWheel.mockReturnValue(makeDefaultWheelMock({
        wheel: null,
        wheels: [softDeletedWheel],
      }))
      render(<WheelPage />)
      expect(screen.getByText(/recover a wheel/i)).toBeInTheDocument()
    })
  })
})
