-- Revoke the implicit table-level UPDATE grant from authenticated.
-- After this, any UPDATE that touches `tier` from browser Supabase client fails with
-- "permission denied for column tier" at the PostgreSQL level.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

-- Re-grant UPDATE only on columns users are legitimately allowed to change.
GRANT UPDATE (avatar_url, color_scheme) ON TABLE public.profiles TO authenticated;

-- Defensive GRANT SELECT — Supabase/PostgREST may reject wildcard selects on tables
-- where column-level grant is active. This is idempotent and clarifies intent.
GRANT SELECT ON TABLE public.profiles TO authenticated;
