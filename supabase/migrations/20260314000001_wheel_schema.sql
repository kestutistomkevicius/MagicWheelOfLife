-- supabase/migrations/20260314000001_wheel_schema.sql
-- Phase 2: Wheel scoring schema
-- Creates: profiles, wheels, categories tables with RLS,
--          handle_new_user() trigger, count_user_wheels() SECURITY DEFINER function

-- ============================================================
-- 1. profiles table
-- Auto-populated on signup via trigger. Stores tier (free/premium).
-- ============================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own" ON public.profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- 2. Auto-create profile trigger (fires AFTER INSERT on auth.users)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 3. wheels table (created before count_user_wheels to avoid forward reference)
-- RLS policies that reference count_user_wheels() are added after the function.
-- ============================================================

CREATE TABLE public.wheels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Wheel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wheels ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. SECURITY DEFINER count function
-- References public.wheels — must be defined AFTER the table exists.
-- Avoids RLS infinite recursion when checking wheel count in INSERT policy.
-- ============================================================

CREATE OR REPLACE FUNCTION public.count_user_wheels()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.wheels WHERE user_id = (select auth.uid());
$$;

-- ============================================================
-- 5. wheels RLS policies (added after count_user_wheels is defined)
-- Free-tier users blocked from inserting a second wheel via SECURITY DEFINER
-- count function in WITH CHECK. Premium users can insert unlimited wheels.
-- ============================================================

CREATE POLICY "wheels: select own" ON public.wheels
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "wheels: insert own" ON public.wheels
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND tier = 'premium')
      OR public.count_user_wheels() < 1
    )
  );

CREATE POLICY "wheels: update own" ON public.wheels
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "wheels: delete own" ON public.wheels
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 6. categories table + RLS
-- ============================================================

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id uuid NOT NULL REFERENCES public.wheels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  score_asis integer NOT NULL DEFAULT 5 CHECK (score_asis BETWEEN 1 AND 10),
  score_tobe integer NOT NULL DEFAULT 5 CHECK (score_tobe BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: select own" ON public.categories
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "categories: insert own" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "categories: update own" ON public.categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "categories: delete own" ON public.categories
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
