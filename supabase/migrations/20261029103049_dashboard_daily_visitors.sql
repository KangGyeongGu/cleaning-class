create table public.analytics_daily_visitors (
  visit_date date not null,
  visitor_key text not null check (visitor_key ~ '^[a-f0-9]{64}$'),
  primary key (visit_date, visitor_key)
);
alter table public.analytics_daily_visitors enable row level security;
revoke all on public.analytics_daily_visitors from public, anon, authenticated;
grant all on public.analytics_daily_visitors to service_role;

create function public.record_daily_visitor(p_key text)
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
  insert into public.analytics_daily_visitors(visit_date, visitor_key)
  values (today, p_key) on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    insert into public.analytics_daily(date, event_type, dimension, count)
    values (today, 'daily_unique_visitor', '', 1)
    on conflict (date,event_type,dimension)
    do update set count = analytics_daily.count + 1;
  end if;
end;
$$;
revoke all on function public.record_daily_visitor(text) from public, anon, authenticated;
grant execute on function public.record_daily_visitor(text) to service_role;

drop policy if exists analytics_events_insert_anon on public.analytics_events;
create policy analytics_events_insert_anon on public.analytics_events
for insert to anon, authenticated
with check (
  event_type not in ('quote_form_success', 'quote_form_click', 'page_landing')
  and char_length(path) <= 500
  and char_length(event_type) <= 50
  and char_length(coalesce(event_payload::text,'')) <= 2000
);

create function public.dashboard_snapshot(p_start date, p_end date)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  oldest date := ((now() at time zone 'Asia/Seoul')::date - interval '6 months')::date;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_start is null or p_end is null or p_start < oldest or p_end > today or p_start > p_end then
    raise exception 'Invalid date range';
  end if;
  with dates as (
    select generate_series(p_start::timestamp,p_end::timestamp,interval '1 day')::date as day
  ), raw_counts as (
    select (created_at at time zone 'Asia/Seoul')::date as day,event_type,
      case when event_type='phone_click' then event_payload->>'phone_type'
           else event_payload->>'inquiry_type' end as dimension,count(*)::integer as count
    from public.analytics_events
    where created_at >= p_start::timestamp at time zone 'Asia/Seoul'
      and created_at < (p_end+1)::timestamp at time zone 'Asia/Seoul'
      and event_type in ('phone_click','quote_form_success')
    group by 1,2,3
  ), counts as (
    select day,event_type,dimension,max(count) as count from (
      select day,event_type,dimension,count from raw_counts
      union all
      select date,event_type,dimension,count from public.analytics_daily
      where date between p_start and p_end and event_type in ('phone_click','quote_form_success')
    ) combined group by day,event_type,dimension
  ), rows as (
    select d.day,
      (select a.count from public.analytics_daily a where a.date=d.day and a.event_type='daily_unique_visitor' and a.dimension='') as visitors,
      coalesce(sum(c.count) filter(where c.event_type='phone_click' and c.dimension='cleaning'),0) as pc,
      coalesce(sum(c.count) filter(where c.event_type='phone_click' and c.dimension='moving'),0) as pm,
      coalesce(sum(c.count) filter(where c.event_type='quote_form_success' and c.dimension='cleaning'),0) as qc,
      coalesce(sum(c.count) filter(where c.event_type='quote_form_success' and c.dimension='moving'),0) as qm
    from dates d left join counts c on c.day=d.day group by d.day
  )
  select coalesce(jsonb_agg(jsonb_build_object('date',day,'visitors',visitors,
    'phoneCleaning',pc,'phoneMoving',pm,'quoteCleaning',qc,'quoteMoving',qm) order by day),'[]'::jsonb) into result from rows;
  return result;
end;
$$;
revoke all on function public.dashboard_snapshot(date,date) from public, anon;
grant execute on function public.dashboard_snapshot(date,date) to authenticated;

create or replace function public.cleanup_analytics_events()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff date := ((now() at time zone 'Asia/Seoul')::date - interval '6 months')::date;
begin
  delete from public.analytics_events where created_at < cutoff::timestamp at time zone 'Asia/Seoul';
  delete from public.analytics_daily where date < cutoff;
  delete from public.analytics_daily_visitors where visit_date < cutoff;
end;
$$;
revoke all on function public.cleanup_analytics_events() from public, anon, authenticated;

create or replace function public.aggregate_analytics_daily()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.analytics_daily(date,event_type,dimension,count)
  select (created_at at time zone 'Asia/Seoul')::date,event_type,
    coalesce(case event_type
      when 'quote_form_success' then event_payload->>'inquiry_type'
      when 'quote_form_error' then event_payload->>'error_kind'
      when 'phone_click' then event_payload->>'phone_type'
      when 'cta_click' then event_payload->>'content_id'
      when 'review_card_click' then event_payload->>'click_source'
      when 'sns_click' then event_payload->>'sns_platform'
      when 'review_filter' then event_payload->>'filter_source'
      when 'page_landing' then event_payload->>'source'
      else '' end,''),count(*)::integer
  from public.analytics_events
  where created_at >= (((now() at time zone 'Asia/Seoul')::date - interval '6 months')::date)::timestamp at time zone 'Asia/Seoul'
    and created_at < ((now() at time zone 'Asia/Seoul')::date)::timestamp at time zone 'Asia/Seoul'
    and event_type <> 'quote_form_click'
  group by 1,2,3
  on conflict(date,event_type,dimension) do update set count=greatest(analytics_daily.count, excluded.count);
end;
$$;
revoke all on function public.aggregate_analytics_daily() from public, anon, authenticated;
