create function public.record_daily_visitor(p_key text, p_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  inserted_count integer;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid visitor key';
  end if;
  if p_date is null or p_date < today - 1 or p_date > today then
    raise exception 'Invalid visit date';
  end if;
  insert into public.analytics_daily_visitors(visit_date, visitor_key)
  values (p_date, p_key) on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    insert into public.analytics_daily(date, event_type, dimension, count)
    values (p_date, 'daily_unique_visitor', '', 1)
    on conflict (date,event_type,dimension)
    do update set count = analytics_daily.count + 1;
  end if;
end;
$$;
revoke all on function public.record_daily_visitor(text,date) from public, anon, authenticated;
grant execute on function public.record_daily_visitor(text,date) to service_role;
drop function public.record_daily_visitor(text);
