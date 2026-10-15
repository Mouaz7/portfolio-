update public.journey_item
set icon_path = case
  when icon_path = '/journey/bth-logo.png' then '/journey/bth-logo.webp'
  when icon_path = '/journey/softhouse.png' then '/journey/softhouse.webp'
  else icon_path
end,
updated_at = timezone('utc', now())
where icon_path in ('/journey/bth-logo.png', '/journey/softhouse.png');
