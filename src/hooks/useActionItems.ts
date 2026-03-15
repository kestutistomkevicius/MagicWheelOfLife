import { supabase } from '@/lib/supabase'
import type { ActionItemRow } from '@/types/database'

export interface UseActionItemsResult {
  loadActionItems: (categoryId: string) => Promise<ActionItemRow[]>
  addActionItem: (params: {
    categoryId: string
    userId: string
    text: string
    currentCount: number
  }) => Promise<ActionItemRow | { error: string }>
  toggleActionItem: (params: {
    id: string
    isComplete: boolean
  }) => Promise<void>
  setDeadline: (params: {
    id: string
    deadline: string | null  // ISO date string 'YYYY-MM-DD' or null to clear
  }) => Promise<void>
  deleteActionItem: (id: string) => Promise<void>
}

export function useActionItems(): UseActionItemsResult {
  async function loadActionItems(categoryId: string): Promise<ActionItemRow[]> {
    const res = await supabase
      .from('action_items')
      .select('id, category_id, user_id, text, is_complete, deadline, position, created_at, updated_at')
      .eq('category_id', categoryId)
      .order('position', { ascending: true })
    return Array.isArray(res.data) ? (res.data as ActionItemRow[]) : []
  }

  async function addActionItem(params: {
    categoryId: string
    userId: string
    text: string
    currentCount: number
  }): Promise<ActionItemRow | { error: string }> {
    const { categoryId, userId, text, currentCount } = params
    if (currentCount >= 7) {
      return { error: 'Maximum 7 action items per category' }
    }
    const res = await supabase
      .from('action_items')
      .insert({
        category_id: categoryId,
        user_id: userId,
        text,
        position: currentCount,
        is_complete: false,
        deadline: null,
      })
      .select()
    const rows = Array.isArray(res.data) ? (res.data as ActionItemRow[]) : []
    const newItem = rows[0]
    if (!newItem || res.error) {
      return { error: res.error?.message ?? 'Failed to add action item' }
    }
    return newItem
  }

  async function toggleActionItem(params: {
    id: string
    isComplete: boolean
  }): Promise<void> {
    await supabase
      .from('action_items')
      .update({ is_complete: params.isComplete, updated_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  async function setDeadline(params: {
    id: string
    deadline: string | null
  }): Promise<void> {
    await supabase
      .from('action_items')
      .update({ deadline: params.deadline, updated_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  async function deleteActionItem(id: string): Promise<void> {
    await supabase
      .from('action_items')
      .delete()
      .eq('id', id)
  }

  return { loadActionItems, addActionItem, toggleActionItem, setDeadline, deleteActionItem }
}
