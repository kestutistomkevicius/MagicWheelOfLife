import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Mock AvatarUpload — presentational, tested separately ──────────────────
vi.mock('@/components/AvatarUpload', () => ({
  AvatarUpload: () => <div data-testid="avatar-upload" />,
}))

// ── Hoisted mocks for useProfile and useAuth ───────────────────────────────
const { mockUpdateTier, mockUseProfile, mockUseAuth } = vi.hoisted(() => {
  const mockUpdateTier = vi.fn().mockResolvedValue(undefined)
  const mockUseProfile = vi.fn()
  const mockUseAuth = vi.fn()
  return { mockUpdateTier, mockUseProfile, mockUseAuth }
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
  updateAvatar: vi.fn().mockResolvedValue(undefined),
  updateTier: mockUpdateTier,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({ session: { user: { id: 'user-123' } }, signOut: vi.fn() })
  mockUseProfile.mockReturnValue({ ...DEFAULT_PROFILE, updateTier: mockUpdateTier })
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
})
