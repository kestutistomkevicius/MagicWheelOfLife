import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database'

export interface UseCategoriesResult {
  addCategory: (params: {
    wheelId: string
    userId: string
    name: string
    currentCount: number
    currentMaxPosition: number
  }) => Promise<CategoryRow | { error: string }>

  renameCategory: (params: {
    categoryId: string
    newName: string
    hasSnapshots: boolean
    onSnapshotWarning: () => void
  }) => Promise<void>

  removeCategory: (params: {
    categoryId: string
    currentCount: number
    hasSnapshots: boolean
    onSnapshotWarning: () => void
  }) => Promise<void | { error: string }>
}

export function useCategories(): UseCategoriesResult {
  async function addCategory(params: {
    wheelId: string
    userId: string
    name: string
    currentCount: number
    currentMaxPosition: number
  }): Promise<CategoryRow | { error: string }> {
    const { wheelId, userId, name, currentCount, currentMaxPosition } = params

    if (currentCount >= 12) {
      return { error: 'Maximum 12 categories reached' }
    }

    const res = await supabase
      .from('categories')
      .insert({
        wheel_id: wheelId,
        user_id: userId,
        name,
        position: currentMaxPosition + 1,
        score_asis: 5,
        score_tobe: 5,
      })
      .select()

    const rows = Array.isArray(res.data) ? (res.data as CategoryRow[]) : []
    const newCategory = rows[0]

    if (!newCategory || res.error) {
      return { error: res.error?.message ?? 'Failed to add category' }
    }

    return newCategory
  }

  async function renameCategory(params: {
    categoryId: string
    newName: string
    hasSnapshots: boolean
    onSnapshotWarning: () => void
  }): Promise<void> {
    const { categoryId, newName, hasSnapshots, onSnapshotWarning } = params

    if (hasSnapshots) {
      onSnapshotWarning()
      return
    }

    await supabase
      .from('categories')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
  }

  async function removeCategory(params: {
    categoryId: string
    currentCount: number
    hasSnapshots: boolean
    onSnapshotWarning: () => void
  }): Promise<void | { error: string }> {
    const { categoryId, currentCount, hasSnapshots, onSnapshotWarning } = params

    if (currentCount <= 3) {
      return { error: 'Minimum 3 categories required' }
    }

    if (hasSnapshots) {
      onSnapshotWarning()
      return
    }

    await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
  }

  return { addCategory, renameCategory, removeCategory }
}
