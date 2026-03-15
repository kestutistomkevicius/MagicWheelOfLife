import { describe, it } from 'vitest'

describe('useSnapshots', () => {
  describe('saveSnapshot', () => {
    it.todo('inserts snapshot row then snapshot_scores rows and returns SnapshotRow (SNAP-01)')
    it.todo('returns error object when snapshot insert fails')
    it.todo('returns error object when score insert fails')
    it.todo('returns error when categories array is empty')
  })

  describe('listSnapshots', () => {
    it.todo('returns snapshots ordered by saved_at descending (SNAP-02)')
    it.todo('returns empty array when no snapshots exist')
  })

  describe('fetchSnapshotScores', () => {
    it.todo('returns scores ordered by position ascending for a given snapshotId')
  })

  describe('checkSnapshotsExist', () => {
    it.todo('returns true when at least one snapshot exists for the wheel')
    it.todo('returns false when no snapshots exist for the wheel')
  })
})
