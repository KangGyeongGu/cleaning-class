create table public.analytics_daily (
  date date not null,
  event_type text not null,
  dimension text not null default '',
  count integer not null default 0,
  primary key (date, event_type, dimension)
);

create index analytics_daily_date_idx
  on public.analytics_daily (date desc);

alter table public.analytics_daily enable row level security;

create policy "analytics_daily_select_authenticated"
  on public.analytics_daily
  for select
  to authenticated
  using (true);

comment on table public.analytics_daily is '일별 집계 — 영구 보관. pg_cron 매일 03:00 KST 에 어제 events 집계.';
comment on column public.analytics_daily.dimension is '세분화 키 (없으면 빈 문자열). PK 안정성 위해 NULL 대신 빈 문자열.';
