// Hand-authored TypeScript types for Supabase public schema (Phase 2).
// Keep in sync with supabase/migrations/20260314000001_wheel_schema.sql.

export type ProfileRow = {
  id: string
  tier: 'free' | 'premium'
  created_at: string
}

export type WheelRow = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type CategoryRow = {
  id: string
  wheel_id: string
  user_id: string
  name: string
  position: number
  score_asis: number
  score_tobe: number
  is_important: boolean  // default false — premium feature
  created_at: string
  updated_at: string
}

export type ActionItemRow = {
  id: string
  category_id: string
  user_id: string
  text: string
  is_complete: boolean
  deadline: string | null      // 'YYYY-MM-DD' or null
  completed_at: string | null  // ISO timestamptz or null — set when item is completed
  note: string | null          // up to 500 chars or null
  position: number
  created_at: string
  updated_at: string
}

export type SnapshotRow = {
  id: string
  wheel_id: string
  user_id: string
  name: string
  saved_at: string  // ISO timestamptz
}

export type SnapshotScoreRow = {
  id: string
  snapshot_id: string
  user_id: string
  category_name: string
  position: number
  score_asis: number
  score_tobe: number
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: '12' }
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at'>
        Update: Partial<Omit<ProfileRow, 'id'>>
        Relationships: []
      }
      wheels: {
        Row: WheelRow
        Insert: Omit<WheelRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<WheelRow, 'name' | 'updated_at'>>
        Relationships: []
      }
      categories: {
        Row: CategoryRow
        Insert: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at' | 'is_important'> & { is_important?: boolean }
        Update: Partial<Pick<CategoryRow, 'name' | 'position' | 'score_asis' | 'score_tobe' | 'is_important' | 'updated_at'>>
        Relationships: []
      }
      action_items: {
        Row: ActionItemRow
        Insert: Omit<ActionItemRow, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'note'> & { completed_at?: string | null; note?: string | null }
        Update: Partial<Pick<ActionItemRow, 'text' | 'is_complete' | 'deadline' | 'completed_at' | 'note' | 'position' | 'updated_at'>>
        Relationships: []
      }
      snapshots: {
        Row: SnapshotRow
        Insert: Omit<SnapshotRow, 'id' | 'saved_at'>
        Update: never
        Relationships: []
      }
      snapshot_scores: {
        Row: SnapshotScoreRow
        Insert: Omit<SnapshotScoreRow, 'id'>
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      count_user_wheels: { Args: Record<string, never>; Returns: number }
    }
    Enums: Record<string, never>
  }
}
