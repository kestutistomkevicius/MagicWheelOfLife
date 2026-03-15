import { supabase } from '@/lib/supabase'
import type { SnapshotRow, SnapshotScoreRow } from '@/types/database'

export interface SaveSnapshotParams {
  wheelId: string
  userId: string
  name: string
  categories: Array<{
    name: string
    position: number
    score_asis: number
    score_tobe: number
  }>
}

export interface UseSnapshotsResult {
  saveSnapshot: (params: SaveSnapshotParams) => Promise<SnapshotRow | { error: string }>
  listSnapshots: (wheelId: string) => Promise<SnapshotRow[]>
  fetchSnapshotScores: (snapshotId: string) => Promise<SnapshotScoreRow[]>
  checkSnapshotsExist: (wheelId: string) => Promise<boolean>
}

export function useSnapshots(): UseSnapshotsResult {
  async function saveSnapshot(params: SaveSnapshotParams): Promise<SnapshotRow | { error: string }> {
    const { wheelId, userId, name, categories } = params
    if (categories.length === 0) {
      return { error: 'Cannot save an empty wheel' }
    }

    const snapRes = await supabase
      .from('snapshots')
      .insert({ wheel_id: wheelId, user_id: userId, name: name.trim() })
      .select()

    const snaps = Array.isArray(snapRes.data) ? (snapRes.data as SnapshotRow[]) : []
    const snap = snaps[0]
    if (!snap || snapRes.error) {
      return { error: snapRes.error?.message ?? 'Failed to save snapshot' }
    }

    const scoreRows = categories.map((cat, i) => ({
      snapshot_id: snap.id,
      user_id: userId,
      category_name: cat.name,
      position: cat.position ?? i,
      score_asis: cat.score_asis,
      score_tobe: cat.score_tobe,
    }))

    const scoresRes = await supabase.from('snapshot_scores').insert(scoreRows)
    if (scoresRes.error) {
      return { error: scoresRes.error.message }
    }

    return snap
  }

  async function listSnapshots(wheelId: string): Promise<SnapshotRow[]> {
    const res = await supabase
      .from('snapshots')
      .select('id, wheel_id, user_id, name, saved_at')
      .eq('wheel_id', wheelId)
      .order('saved_at', { ascending: false })
    return Array.isArray(res.data) ? (res.data as SnapshotRow[]) : []
  }

  async function fetchSnapshotScores(snapshotId: string): Promise<SnapshotScoreRow[]> {
    const res = await supabase
      .from('snapshot_scores')
      .select('id, snapshot_id, user_id, category_name, position, score_asis, score_tobe')
      .eq('snapshot_id', snapshotId)
      .order('position', { ascending: true })
    return Array.isArray(res.data) ? (res.data as SnapshotScoreRow[]) : []
  }

  async function checkSnapshotsExist(wheelId: string): Promise<boolean> {
    const res = await supabase
      .from('snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('wheel_id', wheelId)
    return (res.count ?? 0) > 0
  }

  return { saveSnapshot, listSnapshots, fetchSnapshotScores, checkSnapshotsExist }
}
