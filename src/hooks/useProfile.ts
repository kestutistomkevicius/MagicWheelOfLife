import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UseProfileResult {
  tier: 'free' | 'premium'
  avatarUrl: string | null
  loading: boolean
  updateAvatar: (file: File) => Promise<void>
  updateTier: (newTier: 'free' | 'premium') => Promise<void>
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB

export function useProfile(userId: string): UseProfileResult {
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchProfile() {
      setLoading(true)

      const res = await supabase
        .from('profiles')
        .select('id, tier, avatar_url')
        .eq('id', userId)
        .limit(1)

      if (cancelled) return

      const profile = (Array.isArray(res.data)
        ? (res.data[0] ?? null)
        : (res.data ?? null)) as { tier?: string; avatar_url?: string | null } | null

      setTier(profile?.tier === 'premium' ? 'premium' : 'free')
      setAvatarUrl(profile?.avatar_url ?? null)
      setLoading(false)
    }

    fetchProfile().catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function updateAvatar(file: File): Promise<void> {
    if (file.size > MAX_AVATAR_SIZE) {
      throw new Error('File must be under 2 MB')
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${userId}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId)

    setAvatarUrl(data.publicUrl)
  }

  async function updateTier(newTier: 'free' | 'premium'): Promise<void> {
    await supabase
      .from('profiles')
      .update({ tier: newTier })
      .eq('id', userId)

    setTier(newTier)
  }

  return {
    tier,
    avatarUrl,
    loading,
    updateAvatar,
    updateTier,
  }
}
