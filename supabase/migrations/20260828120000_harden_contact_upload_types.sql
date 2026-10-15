insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-uploads', 'contact-uploads', false, 10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
