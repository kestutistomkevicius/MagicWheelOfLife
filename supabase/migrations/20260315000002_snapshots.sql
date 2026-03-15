-- Phase 4: snapshots + snapshot_scores tables
-- snapshots: one row per manual save event
-- snapshot_scores: immutable text-copy of category scores at save time (no FK to categories)

CREATE TABLE public.snapshots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id   uuid        NOT NULL REFERENCES public.wheels(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  saved_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots: select own" ON public.snapshots
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "snapshots: insert own" ON public.snapshots
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE policy: snapshot name and saved_at are immutable in v1 (SNAP-V2-02 adds rename in v2)

CREATE POLICY "snapshots: delete own" ON public.snapshots
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- snapshot_scores: one row per category per snapshot
-- CRITICAL: category_name is a TEXT COPY, NOT a FK to categories.id
-- This preserves historical accuracy if the user later renames or removes a category.
CREATE TABLE public.snapshot_scores (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   uuid    NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name text    NOT NULL,
  position      integer NOT NULL DEFAULT 0,
  score_asis    integer NOT NULL CHECK (score_asis BETWEEN 1 AND 10),
  score_tobe    integer NOT NULL CHECK (score_tobe BETWEEN 1 AND 10)
);

ALTER TABLE public.snapshot_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshot_scores: select own" ON public.snapshot_scores
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "snapshot_scores: insert own" ON public.snapshot_scores
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- No UPDATE or DELETE policies on snapshot_scores: scores are immutable once written.
-- Deleting a snapshot cascades to its scores via ON DELETE CASCADE on snapshot_id FK.
