do $$
declare
  canonical_href constant text := 'https://beacons.ai/mouaz98';
  icon_svg constant text := '<svg viewBox="0 0 24 24" fill="none"><path d="M10.5 13.5l3-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M7.5 15.5l-1 1a3.536 3.536 0 105 5l3-3a3.536 3.536 0 000-5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M16.5 8.5l1-1a3.536 3.536 0 10-5-5l-3 3a3.536 3.536 0 000 5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
begin
  update public.contact_social
  set name = 'Beacons',
      href = canonical_href,
      is_active = true,
      updated_at = timezone('utc', now())
  where lower(href) like 'https://beacons.ai/mouaz98%'
     or lower(href) like 'https://www.beacons.ai/mouaz98%';

  if not found then
    insert into public.contact_social(name, href, svg_path, viewbox, is_active, sort_order)
    values ('Beacons', canonical_href, icon_svg, '0 0 24 24', true, 4);
  end if;
end;
$$;
