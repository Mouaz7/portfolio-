-- ──────────────────────────────────────────────────────────
-- Skill changes
--   Remove: Jetpack Compose, Firestore (mobile)
--   Replace: Trello → Slack (workflow)  [overlaps with Jira]
--   Add:    CSS3, MySQL, Raspberry Pi, Slack
-- Run in the Supabase SQL editor (project smorlmmexzterelouyrn).
-- Icons use the same devicon CDN as the existing skills.
-- ──────────────────────────────────────────────────────────

-- 1. Remove discontinued skills
DELETE FROM public.skill WHERE name IN ('Jetpack Compose', 'Firestore', 'Trello');

-- 2. Add the new skills
INSERT INTO public.skill (name, category, icon_bucket, icon_path, icon_alt) VALUES
  ('CSS3',         'webdata',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',               'CSS3'),
  ('MySQL',        'storage',  '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',             'MySQL'),
  ('Raspberry Pi', 'devops',   '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/raspberrypi/raspberrypi-original.svg', 'Raspberry Pi'),
  ('Slack',        'workflow', '', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',             'Slack');
