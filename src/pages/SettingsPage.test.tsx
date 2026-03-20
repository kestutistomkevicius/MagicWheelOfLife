import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Mock AvatarUpload — presentational, tested separately ──────────────────
vi.mock('@/components/AvatarUpload', () => ({
  AvatarUpload: () => <div data-testid="avatar-upload" />,
}))

// ── Mock ColorSchemePicker ─────────────────────────────────────────────────
const { mockOnSelect } = vi.hoisted(() => {
  const mockOnSelect = vi.fn()
  return { mockOnSelect }
})

vi.mock('@/components/ColorSchemePicker', () => ({
  ColorSchemePicker: ({ currentPalette, onSelect }: { currentPalette: string; onSelect: (name: string) => void }) => (
    <div data-testid="color-scheme-picker" data-palette={currentPalette}>
      <button onClick={() => onSelect('ocean')} aria-label="select ocean swatch">Ocean</button>
    </div>
  ),
}))

// ── Mock usePalette ────────────────────────────────────────────────────────
const { mockApplyPalette, mockUsePalette } = vi.hoisted(() => {
  const mockApplyPalette = vi.fn()
  const mockUsePalette = vi.fn()
  return { mockApplyPalette, mockUsePalette }
})

vi.mock('@/contexts/PaletteContext', () => ({
  usePalette: mockUsePalette,
}))

// ── Hoisted mocks for useProfile and useAuth ───────────────────────────────
const { mockUpdateTier, mockUpdateColorScheme, mockUseProfile, mockUseAuth } = vi.hoisted(() => {
  const mockUpdateTier = vi.fn().mockResolvedValue(undefined)
  const mockUpdateColorScheme = vi.fn().mockResolvedValue(undefined)
  const mockUseProfile = vi.fn()
  const mockUseAuth = vi.fn()
  return { mockUpdateTier, mockUpdateColorScheme, mockUseProfile, mockUseAuth }
})

vi.mock('@/hooks/useProfile', () => ({
  useProfile: mockUseProfile,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

import { SettingsPage } from './SettingsPage'

const DEFAULT_PROFILE = {
  tier: 'free' as const,
  avatarUrl: null,
  loading: false,
  colorScheme: 'amber',
  updateAvatar: vi.fn().mockResolvedValue(undefined),
  updateTier: mockUpdateTier,
  updateColorScheme: mockUpdateColorScheme,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ session: { user: { id: 'user-123' } }, signOut: vi.fn() })
  mockUseProfile.mockReturnValue({ ...DEFAULT_PROFILE, updateTier: mockUpdateTier, updateColorScheme: mockUpdateColorScheme })
  mockUsePalette.mockReturnValue({ currentPalette: 'amber', applyPalette: mockApplyPalette })
  // Reset env
  // @ts-expect-error — override for testing
  import.meta.env.VITE_SHOW_TIER_TOGGLE = undefined
})

describe('SettingsPage', () => {
  it('renders avatar upload section', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('avatar-upload')).toBeTruthy()
  })

  it('renders current tier display', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Free')).toBeTruthy()
  })

  it('renders dev-only tier toggle when DEV is true', () => {
    // @ts-expect-error — override for testing
    import.meta.env.DEV = true
    render(<SettingsPage />)
    expect(screen.getByRole('button', { name: /switch to premium/i })).toBeTruthy()
  })

  it('does not render dev-only tier toggle when DEV is false', () => {
    // @ts-expect-error — override for testing
    import.meta.env.DEV = false
    render(<SettingsPage />)
    expect(screen.queryByRole('button', { name: /switch to/i })).toBeNull()
  })

  it('tier toggle calls updateTier with opposite tier', () => {
    // @ts-expect-error — override for testing
    import.meta.env.DEV = true
    render(<SettingsPage />)
    const toggleBtn = screen.getByRole('button', { name: /switch to premium/i })
    fireEvent.click(toggleBtn)
    expect(mockUpdateTier).toHaveBeenCalledWith('premium')
  })

  describe('ColorSchemePicker (PREMIUM-02)', () => {
    it('renders ColorSchemePicker inside SettingsPage', () => {
      render(<SettingsPage />)
      expect(screen.getByTestId('color-scheme-picker')).toBeInTheDocument()
    })

    it('ColorSchemePicker receives currentPalette from colorScheme', () => {
      render(<SettingsPage />)
      expect(screen.getByTestId('color-scheme-picker')).toHaveAttribute('data-palette', 'amber')
    })

    it('clicking a swatch calls updateColorScheme with the palette name', () => {
      render(<SettingsPage />)
      fireEvent.click(screen.getByRole('button', { name: /select ocean swatch/i }))
      expect(mockUpdateColorScheme).toHaveBeenCalledWith('ocean')
    })

    it('clicking a swatch also calls applyPalette', () => {
      render(<SettingsPage />)
      fireEvent.click(screen.getByRole('button', { name: /select ocean swatch/i }))
      expect(mockApplyPalette).toHaveBeenCalledWith('ocean')
    })
  })

  describe('PREMIUM-01 tier toggle visibility', () => {
    it('tier toggle renders when VITE_SHOW_TIER_TOGGLE is true', () => {
      // @ts-expect-error — override for testing
      import.meta.env.DEV = false
      // @ts-expect-error — override for testing
      import.meta.env.VITE_SHOW_TIER_TOGGLE = 'true'
      render(<SettingsPage />)
      expect(screen.getByRole('button', { name: /switch to premium/i })).toBeTruthy()
    })

    it('tier toggle NOT rendered when neither DEV nor VITE_SHOW_TIER_TOGGLE is set', () => {
      // @ts-expect-error — override for testing
      import.meta.env.DEV = false
      // @ts-expect-error — override for testing
      import.meta.env.VITE_SHOW_TIER_TOGGLE = undefined
      render(<SettingsPage />)
      expect(screen.queryByRole('button', { name: /switch to/i })).toBeNull()
    })
  })
})
