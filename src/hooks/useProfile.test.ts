import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Supabase mock (vi.hoisted for variables used inside vi.mock factory) ──────
const { mockFrom, mockStorageFrom, mockUpload, mockGetPublicUrl, mockUpdate, mockEq, mockSelect, mockLimit } = vi.hoisted(() => {
  const mockUpload = vi.fn()
  const mockGetPublicUrl = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockLimit = vi.fn()
  const mockFrom = vi.fn()
  const mockStorageFrom = vi.fn()
  return { mockFrom, mockStorageFrom, mockUpload, mockGetPublicUrl, mockUpdate, mockEq, mockSelect, mockLimit }
})

vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: mockFrom,
      storage: {
        from: mockStorageFrom,
      },
    },
  }
})

import { useProfile } from './useProfile'

// ── Helper: build DB chain ────────────────────────────────────────────────────
function buildDbChain(terminalResult: unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = mockSelect.mockReturnValue(chain)
  chain.update = mockUpdate.mockReturnValue(chain)
  chain.eq = mockEq.mockReturnValue(chain)
  chain.limit = mockLimit.mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(terminalResult).then(resolve)
  return chain
}

// ── Test data ─────────────────────────────────────────────────────────────────
const USER_ID = 'user-abc'

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns avatarUrl as null when no avatar is set', async () => {
    mockFrom.mockReturnValue(
      buildDbChain({ data: [{ id: USER_ID, tier: 'free', avatar_url: null }], error: null })
    )

    const { result } = renderHook(() => useProfile(USER_ID))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.avatarUrl).toBeNull()
    expect(result.current.tier).toBe('free')
  })

  it('returns tier from profiles row', async () => {
    mockFrom.mockReturnValue(
      buildDbChain({ data: [{ id: USER_ID, tier: 'premium', avatar_url: null }], error: null })
    )

    const { result } = renderHook(() => useProfile(USER_ID))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tier).toBe('premium')
  })

  it('updateAvatar uploads file to storage and updates profiles.avatar_url', async () => {
    // Initial profile fetch
    mockFrom.mockReturnValueOnce(
      buildDbChain({ data: [{ id: USER_ID, tier: 'free', avatar_url: null }], error: null })
    )
    // profiles.update call
    const updateChain: Record<string, unknown> = {}
    updateChain.eq = vi.fn().mockReturnValue(updateChain)
    updateChain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve)
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue(updateChain),
    })

    // Storage mock
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://storage.example.com/user-abc/avatar.png' } })
    const storageBucket = {
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }
    mockStorageFrom.mockReturnValue(storageBucket)

    const { result } = renderHook(() => useProfile(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const file = new File(['content'], 'photo.png', { type: 'image/png' })
    await result.current.updateAvatar(file)

    expect(mockStorageFrom).toHaveBeenCalledWith('avatars')
    expect(mockUpload).toHaveBeenCalledWith(
      `${USER_ID}/avatar.png`,
      file,
      { upsert: true, contentType: 'image/png' }
    )
    expect(mockGetPublicUrl).toHaveBeenCalledWith(`${USER_ID}/avatar.png`)
    expect(result.current.avatarUrl).toBe('https://storage.example.com/user-abc/avatar.png')
  })

  it('updateAvatar throws if file exceeds 2 MB', async () => {
    mockFrom.mockReturnValue(
      buildDbChain({ data: [{ id: USER_ID, tier: 'free', avatar_url: null }], error: null })
    )

    const { result } = renderHook(() => useProfile(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Create a file stub that exceeds 2 MB
    const bigFile = new File(['x'.repeat(1)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 3 * 1024 * 1024 })

    await expect(result.current.updateAvatar(bigFile)).rejects.toThrow('File must be under 2 MB')
  })

  it('updateTier writes new tier to profiles row (dev only)', async () => {
    // Initial fetch
    mockFrom.mockReturnValueOnce(
      buildDbChain({ data: [{ id: USER_ID, tier: 'free', avatar_url: null }], error: null })
    )
    // update call
    const updateChain: Record<string, unknown> = {}
    updateChain.eq = vi.fn().mockReturnValue(updateChain)
    updateChain.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).then(resolve)
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue(updateChain),
    })

    const { result } = renderHook(() => useProfile(USER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updateTier('premium')

    expect(result.current.tier).toBe('premium')
  })
})
