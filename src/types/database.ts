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
  created_at: string
  updated_at: string
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
        Insert: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<CategoryRow, 'name' | 'position' | 'score_asis' | 'score_tobe' | 'updated_at'>>
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
