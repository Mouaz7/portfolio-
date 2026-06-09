-- ──────────────────────────────────────────────────────────
-- Skill-ändringar (kör i Supabase SQL editor, projekt smorlmmexzterelouyrn)
--   Ta bort:  GCP, Jetpack Compose
--   Lägg till: CSS3, MySQL, GitHub, Azure SQL Database, Flutter, Swift
--   (Cypress finns redan under "Tools & Workflow" – ingen ändring.)
--   Ikoner använder icon.icepanel.io, samma stil som befintliga skills.
-- Idempotent: raderar på namn innan insert så den kan köras om.
-- ──────────────────────────────────────────────────────────

-- 1. Ta bort
DELETE FROM public.skill
WHERE name IN ('GCP', 'Jetpack Compose');

-- 2. Lägg till (radera först så omkörning inte ger dubbletter)
DELETE FROM public.skill
WHERE name IN ('CSS3', 'MySQL', 'GitHub', 'Azure SQL Database', 'Flutter', 'Swift');

INSERT INTO public.skill (name, category, icon_bucket, icon_path, icon_alt) VALUES
  ('CSS3',               'frontend', '', 'https://icon.icepanel.io/Technology/svg/CSS3.svg',               'CSS3'),
  ('Flutter',            'mobile',   '', 'https://icon.icepanel.io/Technology/svg/Flutter.svg',            'Flutter'),
  ('Swift',              'mobile',   '', 'https://icon.icepanel.io/Technology/svg/Swift.svg',              'Swift'),
  ('MySQL',              'storage',  '', 'https://icon.icepanel.io/Technology/svg/MySQL.svg',              'MySQL'),
  ('Azure SQL Database', 'storage',  '', 'https://icon.icepanel.io/Technology/svg/Azure-SQL-Database.svg', 'Azure SQL Database'),
  ('GitHub',             'devops',   '', 'https://icon.icepanel.io/Technology/svg/GitHub.svg',             'GitHub');
