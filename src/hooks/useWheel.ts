import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { supabase } from '@/lib/supabase'
import type { WheelRow, CategoryRow } from '@/types/database'

export type { CategoryRow }

const TEMPLATE_CATEGORIES = [
  'Health',
  'Career',
  'Relationships',
  'Finance',
  'Fun & Recreation',
  'Personal Growth',
  'Physical Environment',
  'Family & Friends',
]

const BLANK_CATEGORIES = ['Category 1', 'Category 2', 'Category 3']

export type CreateWheelMode = 'template' | 'blank'

export interface UseWheelResult {
  wheel: WheelRow | null | undefined // undefined = loading
  wheels: WheelRow[]
  categories: CategoryRow[]
  setCategories: Dispatch<SetStateAction<CategoryRow[]>>
  loading: boolean
  error: string | null
  canCreateWheel: boolean
  tier: 'free' | 'premium'
  selectWheel: (wheelId: string) => Promise<void>
  createWheel: (mode: CreateWheelMode, name: string, userId: string) => Promise<WheelRow | null>
  updateScore: (
    categoryId: string,
    field: 'score_asis' | 'score_tobe',
    value: number
  ) => Promise<void>
  renameWheel: (wheelId: string, newName: string) => Promise<void>
  updateCategoryImportant: (categoryId: string, isImportant: boolean) => Promise<void>
}

export function useWheel(userId: string): UseWheelResult {
  const [wheel, setWheel] = useState<WheelRow | null | undefined>(undefined)
  const [wheels, setWheels] = useState<WheelRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canCreateWheel, setCanCreateWheel] = useState(false)
  const [tier, setTier] = useState<'free' | 'premium'>('free')

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

      const profile = (Array.isArray(profileRes.data)
        ? (profileRes.data[0] ?? null)
        : (profileRes.data ?? null)) as { tier?: string } | null

      const userTier: 'free' | 'premium' = profile?.tier === 'premium' ? 'premium' : 'free'
      setTier(userTier)

      // Fetch all user wheels
      const wheelsRes = await supabase
        .from('wheels')
        .select('id, user_id, name, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at')

      if (cancelled) return

      if (wheelsRes.error) {
        setError(wheelsRes.error.message)
        setLoading(false)
        return
      }

      const allWheels = Array.isArray(wheelsRes.data) ? (wheelsRes.data as WheelRow[]) : []
      setWheels(allWheels)
      setCanCreateWheel(userTier === 'premium' || allWheels.length === 0)

      const firstWheel = allWheels[0] ?? null

      if (firstWheel) {
        const catsRes = await supabase
          .from('categories')
          .select('id, wheel_id, user_id, name, position, score_asis, score_tobe, is_important, created_at, updated_at')
          .eq('wheel_id', firstWheel.id)
          .order('position')

        if (cancelled) return

        const cats = Array.isArray(catsRes.data) ? (catsRes.data as CategoryRow[]) : []
        setCategories(cats)
      }

      setWheel(firstWheel)
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

  async function selectWheel(wheelId: string): Promise<void> {
    const found = wheels.find(w => w.id === wheelId) ?? null
    if (!found) return

    const catsRes = await supabase
      .from('categories')
      .select('id, wheel_id, user_id, name, position, score_asis, score_tobe, is_important, created_at, updated_at')
      .eq('wheel_id', wheelId)
      .order('position')

    const cats = Array.isArray(catsRes.data) ? (catsRes.data as CategoryRow[]) : []
    setCategories(cats)
    setWheel(found)
  }

  async function createWheel(mode: CreateWheelMode, name: string, userId: string): Promise<WheelRow | null> {
    const wheelRes = await supabase
      .from('wheels')
      .insert({ user_id: userId, name: name.trim() || 'My Wheel' })
      .select()

    const wheelsInserted = Array.isArray(wheelRes.data) ? (wheelRes.data as WheelRow[]) : []
    const newWheel = wheelsInserted[0] ?? null

    if (!newWheel || wheelRes.error) {
      setError(wheelRes.error?.message ?? 'Failed to create wheel')
      return null
    }

    const categoryNames = mode === 'template' ? TEMPLATE_CATEGORIES : BLANK_CATEGORIES
    const categoryRows = categoryNames.map((catName, index) => ({
      wheel_id: newWheel.id,
      user_id: userId,
      name: catName,
      position: index,
      score_asis: 5,
      score_tobe: 5,
    }))

    const catsRes = await supabase.from('categories').insert(categoryRows).select()
    const newCats = Array.isArray(catsRes.data) ? (catsRes.data as CategoryRow[]) : []

    setCategories(newCats)
    setWheel(newWheel)
    setWheels(prev => [...prev, newWheel])
    setCanCreateWheel(tier === 'premium')
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

  async function renameWheel(wheelId: string, newName: string): Promise<void> {
    const trimmed = newName.trim()
    if (!trimmed) return
    await supabase
      .from('wheels')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', wheelId)
    setWheel(prev => prev ? { ...prev, name: trimmed } : prev)
    setWheels(prev => prev.map(w => w.id === wheelId ? { ...w, name: trimmed } : w))
  }

  function reorderWithImportantFirst(cats: CategoryRow[]): CategoryRow[] {
    const important = cats.filter(c => c.is_important).slice(0, 3)
    const rest = cats.filter(c => !important.find(i => i.id === c.id))
    const reordered = [...important, ...rest]
    return reordered.map((c, i) => ({ ...c, position: i }))
  }

  async function updateCategoryImportant(categoryId: string, isImportant: boolean): Promise<void> {
    // Optimistic local update first
    setCategories(prev => {
      const updated = prev.map(c => c.id === categoryId ? { ...c, is_important: isImportant } : c)
      return reorderWithImportantFirst(updated)
    })

    // Persist is_important flag
    await supabase
      .from('categories')
      .update({ is_important: isImportant, updated_at: new Date().toISOString() })
      .eq('id', categoryId)

    // Persist positions in batch
    setCategories(prev => {
      const reordered = reorderWithImportantFirst(prev)
      const now = new Date().toISOString()
      void Promise.all(
        reordered.map(c =>
          supabase
            .from('categories')
            .update({ position: c.position, updated_at: now })
            .eq('id', c.id)
        )
      )
      return reordered
    })
  }

  return {
    wheel,
    wheels,
    categories,
    setCategories,
    loading,
    error,
    canCreateWheel,
    tier,
    selectWheel,
    createWheel,
    updateScore,
    renameWheel,
    updateCategoryImportant,
  }
}
