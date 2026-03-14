import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { supabase } from '@/lib/supabase'
import type { WheelRow, CategoryRow } from '@/types/database'

export type { CategoryRow }

const DEFAULT_CATEGORIES = [
  'Health',
  'Career',
  'Relationships',
  'Finance',
  'Fun & Recreation',
  'Personal Growth',
  'Physical Environment',
  'Family & Friends',
]

export type CreateWheelMode = 'template' | 'blank'

export interface UseWheelResult {
  wheel: WheelRow | null | undefined // undefined = loading
  categories: CategoryRow[]
  setCategories: Dispatch<SetStateAction<CategoryRow[]>>
  loading: boolean
  error: string | null
  canCreateWheel: boolean
  createWheel: (mode: CreateWheelMode, userId: string) => Promise<WheelRow | null>
  updateScore: (
    categoryId: string,
    field: 'score_asis' | 'score_tobe',
    value: number
  ) => Promise<void>
}

export function useWheel(userId: string): UseWheelResult {
  const [wheel, setWheel] = useState<WheelRow | null | undefined>(undefined)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canCreateWheel, setCanCreateWheel] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)

      // Fetch profile to determine tier
      const profileRes = await supabase
        .from('profiles')
        .select('id, tier, created_at')
        .eq('id', userId)
        .limit(1)

      if (cancelled) return

      const profile = Array.isArray(profileRes.data)
        ? (profileRes.data[0] ?? null)
        : (profileRes.data ?? null)

      const tier = (profile as { tier?: string } | null)?.tier ?? 'free'

      // Fetch the user's first wheel
      const wheelsRes = await supabase
        .from('wheels')
        .select('id, user_id, name, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at')
        .limit(1)

      if (cancelled) return

      if (wheelsRes.error) {
        setError(wheelsRes.error.message)
        setLoading(false)
        return
      }

      const wheelsData = Array.isArray(wheelsRes.data) ? wheelsRes.data : []
      const foundWheel = (wheelsData[0] as WheelRow | undefined) ?? null

      // Compute canCreateWheel: premium can always create; free only if no wheel exists
      const wheelCount = wheelsData.length
      setCanCreateWheel(tier === 'premium' || wheelCount === 0)

      if (foundWheel) {
        // Fetch categories for this wheel
        const catsRes = await supabase
          .from('categories')
          .select('id, wheel_id, user_id, name, position, score_asis, score_tobe, created_at, updated_at')
          .eq('wheel_id', foundWheel.id)
          .order('position')

        if (cancelled) return

        const cats = Array.isArray(catsRes.data) ? (catsRes.data as CategoryRow[]) : []
        setCategories(cats)
      }

      setWheel(foundWheel)
      setLoading(false)
    }

    fetchData().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function createWheel(mode: CreateWheelMode, userId: string): Promise<WheelRow | null> {
    // Insert wheel
    const wheelRes = await supabase
      .from('wheels')
      .insert({ user_id: userId, name: 'My Wheel' })
      .select()

    const wheelsInserted = Array.isArray(wheelRes.data) ? (wheelRes.data as WheelRow[]) : []
    const newWheel = wheelsInserted[0] ?? null

    if (!newWheel || wheelRes.error) {
      setError(wheelRes.error?.message ?? 'Failed to create wheel')
      return null
    }

    if (mode === 'template') {
      const categoryRows = DEFAULT_CATEGORIES.map((name, index) => ({
        wheel_id: newWheel.id,
        user_id: userId,
        name,
        position: index,
        score_asis: 5,
        score_tobe: 5,
      }))

      const catsRes = await supabase.from('categories').insert(categoryRows).select()
      const newCats = Array.isArray(catsRes.data) ? (catsRes.data as CategoryRow[]) : []

      setCategories(newCats)
    } else {
      setCategories([])
    }

    setWheel(newWheel)
    setCanCreateWheel(false) // free tier: just created one
    return newWheel
  }

  async function updateScore(
    categoryId: string,
    field: 'score_asis' | 'score_tobe',
    value: number
  ): Promise<void> {
    await supabase
      .from('categories')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
  }

  return {
    wheel,
    categories,
    setCategories,
    loading,
    error,
    canCreateWheel,
    createWheel,
    updateScore,
  }
}
