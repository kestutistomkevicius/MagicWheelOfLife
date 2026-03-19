-- Add color_scheme column to profiles for per-user palette preference
-- Default 'amber' preserves current appearance for all existing users

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS color_scheme text NOT NULL DEFAULT 'amber';
