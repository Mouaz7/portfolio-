-- Keep the 2025–2026 appointment and add the new academic-year period.
begin;

insert into public.journey_item (
  id, title, details, start_date, end_date,
  icon_bucket, icon_path, icon_alt, sort_order, is_active
)
values (
  '5af63e1d-e4d5-438a-9845-c33fe4834273',
  'C++ Teaching Assistant (OOP) – BTH',
  'Taught C++ and OOP during lab sessions.',
  '2026-09-01T00:00:00+00:00',
  '2027-06-15T00:00:00+00:00',
  '', '/journey/bth-logo.webp', 'C++', 0, true
)
on conflict (id) do nothing;

insert into public.content_translation (entity_type, entity_id, locale, fields)
values
  ('journey_item', '5af63e1d-e4d5-438a-9845-c33fe4834273', 'sv', '{"title":"Amanuens i C++ och OOP – BTH","details":"Undervisade i C++ och objektorienterad programmering under laborationer.","icon_alt":"C++"}'::jsonb),
  ('journey_item', '5af63e1d-e4d5-438a-9845-c33fe4834273', 'ar', '{"title":"مساعد تدريس C++ والبرمجة كائنية التوجّه – BTH","details":"درّست C++ والبرمجة كائنية التوجّه خلال الجلسات العملية.","icon_alt":"C++"}'::jsonb)
on conflict (entity_type, entity_id, locale) do nothing;

commit;
