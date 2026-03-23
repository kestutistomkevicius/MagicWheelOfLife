-- supabase/migrations/20260321000001_wheel_soft_delete.sql
-- Phase 10: Soft-delete for wheels
-- Adds deleted_at column, updates count_user_wheels() to ignore soft-deleted wheels,
-- and schedules a pg_cron job to hard-delete after 10 minutes.

-- 1. Add deleted_at column (nullable — NULL means active)
ALTER TABLE public.wheels
  ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- 2. Update count_user_wheels() to exclude soft-deleted wheels.
--    Free-tier INSERT policy calls this to enforce the 1-wheel limit.
--    Uses CREATE OR REPLACE so no DROP/recreate needed.
CREATE OR REPLACE FUNCTION public.count_user_wheels()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.wheels
  WHERE user_id = (SELECT auth.uid())
    AND deleted_at IS NULL;
$$;

-- 3. pg_cron: hard-delete soft-deleted wheels older than 10 minutes.
--    Runs every 10 minutes. pg_cron extension already enabled from Phase 9 migration.
SELECT cron.schedule(
  'hard-delete-soft-deleted-wheels',
  '*/10 * * * *',
  $$DELETE FROM public.wheels WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '10 minutes'$$
);
