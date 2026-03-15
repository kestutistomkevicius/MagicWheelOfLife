-- Migration: action_items table for Phase 3
-- Each category can have 0-7 action items.
-- user_id is denormalized for RLS efficiency (avoids joining through categories to wheels).
-- ON DELETE CASCADE from categories removes action items automatically when a category is deleted.

CREATE TABLE public.action_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text        NOT NULL,
  is_complete boolean     NOT NULL DEFAULT false,
  deadline    date,                           -- nullable; date-only, no time component
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_items: select own"
  ON public.action_items FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "action_items: insert own"
  ON public.action_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "action_items: update own"
  ON public.action_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "action_items: delete own"
  ON public.action_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
