-- Phase 7 Polish: add completion tracking to action_items and importance flag to categories

ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS note varchar(500);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false;

-- Backfill completed_at for existing completed rows (prevents null dates in completed table UI)
UPDATE public.action_items
SET completed_at = updated_at
WHERE is_complete = true AND completed_at IS NULL;
