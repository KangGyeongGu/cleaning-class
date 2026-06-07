create extension if not exists pg_cron;

create or replace function public.aggregate_analytics_daily()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.analytics_daily (date, event_type, dimension, count)
  select
    (created_at at time zone 'Asia/Seoul')::date as date,
    event_type,
    coalesce(
      case event_type
        when 'quote_form_click' then event_payload->>'inquiry_type'
        when 'quote_form_success' then event_payload->>'inquiry_type'
        when 'quote_form_error' then event_payload->>'error_kind'
        when 'phone_click' then event_payload->>'phone_type'
        when 'cta_click' then event_payload->>'content_id'
        when 'review_card_click' then event_payload->>'click_source'
        when 'sns_click' then event_payload->>'sns_platform'
        when 'faq_open' then ''
        when 'review_filter' then event_payload->>'filter_source'
        when 'page_landing' then event_payload->>'source'
        else ''
      end,
      ''
    ) as dimension,
    count(*) as count
  from public.analytics_events
  where (created_at at time zone 'Asia/Seoul')::date
        = ((now() at time zone 'Asia/Seoul')::date - interval '1 day')::date
  group by 1, 2, 3
  on conflict (date, event_type, dimension)
    do update set count = excluded.count;
end;
$$;

create or replace function public.cleanup_analytics_events()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.analytics_events
  where created_at < now() - interval '90 days';
end;
$$;

select cron.schedule(
  'analytics_daily_aggregate',
  '0 18 * * *',
  $$select public.aggregate_analytics_daily();$$
);

select cron.schedule(
  'analytics_events_retention',
  '0 19 * * *',
  $$select public.cleanup_analytics_events();$$
);

comment on function public.aggregate_analytics_daily is '매일 KST 03:00 에 어제 events 를 (event_type, dimension) 별 카운트로 analytics_daily 에 upsert.';
comment on function public.cleanup_analytics_events is '매일 KST 04:00 에 90일 이전 events 삭제.';
