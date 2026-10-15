create or replace function public.acquire_request_budget(
  p_action text,
  p_ip_hash text,
  p_session_hash text,
  p_session_limit integer,
  p_session_window_seconds integer,
  p_ip_limit integer,
  p_ip_window_seconds integer,
  p_global_limit integer,
  p_global_window_seconds integer,
  p_concurrency_limit integer,
  p_lease_seconds integer,
  p_captcha_verified boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  session_start timestamptz;
  ip_start timestamptz;
  global_start timestamptz;
  session_count integer;
  ip_count integer;
  global_count integer;
  active_count integer;
  lease_id uuid;
begin
  if p_action !~ '^[a-z_]{2,40}$'
    or char_length(p_ip_hash) < 32
    or char_length(p_session_hash) < 32
    or least(
      p_session_limit, p_session_window_seconds, p_ip_limit, p_ip_window_seconds,
      p_global_limit, p_global_window_seconds, p_concurrency_limit, p_lease_seconds
    ) < 1 then
    raise exception 'invalid request budget arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_action, 0));
  delete from public.request_lease where expires_at <= v_now;
  delete from public.request_quota where expires_at <= v_now;

  session_start := to_timestamp(floor(extract(epoch from v_now) / p_session_window_seconds) * p_session_window_seconds);
  ip_start := to_timestamp(floor(extract(epoch from v_now) / p_ip_window_seconds) * p_ip_window_seconds);
  global_start := to_timestamp(floor(extract(epoch from v_now) / p_global_window_seconds) * p_global_window_seconds);

  select coalesce(max(request_count), 0) into session_count from public.request_quota
    where action = p_action and scope = 'session' and subject_hash = p_session_hash and bucket_start = session_start;
  select coalesce(max(request_count), 0) into ip_count from public.request_quota
    where action = p_action and scope = 'ip' and subject_hash = p_ip_hash and bucket_start = ip_start;
  select coalesce(max(request_count), 0) into global_count from public.request_quota
    where action = p_action and scope = 'global' and subject_hash = 'global' and bucket_start = global_start;
  select count(*) into active_count from public.request_lease
    where action = p_action and expires_at > v_now;

  if global_count >= p_global_limit
    or session_count >= p_session_limit
    or ip_count >= p_ip_limit then
    return jsonb_build_object('allowed', false, 'reason', 'rate_limited');
  end if;
  if active_count >= p_concurrency_limit then
    return jsonb_build_object('allowed', false, 'reason', 'busy');
  end if;
  if not p_captcha_verified and (
    session_count >= greatest(1, p_session_limit - 1)
    or ip_count >= greatest(1, p_ip_limit - 1)
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'captcha_required');
  end if;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'session', p_session_hash, session_start, session_start + make_interval(secs => p_session_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'ip', p_ip_hash, ip_start, ip_start + make_interval(secs => p_ip_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_quota(action, scope, subject_hash, bucket_start, expires_at, request_count)
  values (p_action, 'global', 'global', global_start, global_start + make_interval(secs => p_global_window_seconds), 1)
  on conflict (action, scope, subject_hash, bucket_start)
  do update set request_count = public.request_quota.request_count + 1;

  insert into public.request_lease(action, session_hash, expires_at)
  values (p_action, p_session_hash, v_now + make_interval(secs => p_lease_seconds))
  returning id into lease_id;

  return jsonb_build_object('allowed', true, 'lease_id', lease_id);
end;
$$;

create or replace function public.acquire_concurrency_lease(
  p_action text,
  p_session_hash text,
  p_concurrency_limit integer,
  p_lease_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  lease_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_action, 0));
  delete from public.request_lease where expires_at <= v_now;
  if (select count(*) from public.request_lease where action = p_action and expires_at > v_now) >= p_concurrency_limit then
    return null;
  end if;
  insert into public.request_lease(action, session_hash, expires_at)
  values (p_action, p_session_hash, v_now + make_interval(secs => p_lease_seconds))
  returning id into lease_id;
  return lease_id;
end;
$$;
