-- Migration: avatar_url column, feature_requests table, avatars storage bucket
-- Phase 8 — Profile, Settings & Content
-- Requires: profiles table (Phase 2), storage schema (Supabase built-in)

-- 1. Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create feature_requests table
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  text text NOT NULL CHECK (char_length(text) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_requests: insert authenticated" ON public.feature_requests
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- No SELECT policy for users — founder reads via Studio/service role only

-- 3. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for avatars bucket
CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars: authenticated update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
