-- Uploads remain quarantined in the private bucket until malware scanning has
-- reached an explicit terminal state.
alter table public.contact_upload
  add column if not exists scan_status text not null default 'pending_scan',
  add column if not exists scanned_at timestamptz;

alter table public.contact_upload
  drop constraint if exists contact_upload_scan_status_check;

alter table public.contact_upload
  add constraint contact_upload_scan_status_check
  check (scan_status in ('pending_scan', 'clean', 'infected', 'scan_failed'));

create index if not exists contact_upload_pending_scan_idx
  on public.contact_upload (created_at)
  where scan_status = 'pending_scan';

comment on column public.contact_upload.scan_status is
  'Provider-neutral quarantine state. Only clean files may be delivered.';
