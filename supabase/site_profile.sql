-- ──────────────────────────────────────────────────────────
-- site_profile — DB-driven content for the home hero.
-- Single row (id = 1). Edit these values to change the hero copy
-- without touching code (mirrors site_theme). Public read via RLS.
-- Run this in the Supabase SQL editor.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_profile (
  id           int         PRIMARY KEY DEFAULT 1,
  greeting     text        NOT NULL DEFAULT 'Hi, I''m',
  name         text        NOT NULL DEFAULT 'Mouaz Naji',
  role_prefix  text        NOT NULL DEFAULT 'Software',
  roles        text[]      NOT NULL DEFAULT ARRAY['Engineer','Developer'],
  tagline      text        NOT NULL DEFAULT 'I craft fast, accessible web & systems software — turning ideas into clean interfaces backed by reliable, well-tested code.',
  location     text        NOT NULL DEFAULT 'Karlskrona, Sweden',
  availability text        NOT NULL DEFAULT 'Open to opportunities',
  available    boolean     NOT NULL DEFAULT true,
  cv_url       text        NOT NULL DEFAULT '/api/cv',
  focus_areas  text[]      NOT NULL DEFAULT ARRAY['AI Engineering','Security','Full-Stack','Systems','DevOps'],
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT site_profile_singleton CHECK (id = 1)
);

-- Add the column on existing installs (safe to re-run).
ALTER TABLE public.site_profile
  ADD COLUMN IF NOT EXISTS focus_areas text[]
  NOT NULL DEFAULT ARRAY['AI Engineering','Security','Full-Stack','Systems','DevOps'];

ALTER TABLE public.site_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_profile" ON public.site_profile;
CREATE POLICY "Public read site_profile"
  ON public.site_profile FOR SELECT USING (true);

-- Seed / upsert the single row.
INSERT INTO public.site_profile (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
