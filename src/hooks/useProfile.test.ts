import { describe, it } from 'vitest'

describe('useProfile', () => {
  it.todo('returns avatarUrl as null when no avatar is set')
  it.todo('returns tier from profiles row')
  it.todo('updateAvatar uploads file to storage and updates profiles.avatar_url')
  it.todo('updateAvatar throws if file exceeds 2 MB')
  it.todo('updateTier writes new tier to profiles row (dev only)')
})
