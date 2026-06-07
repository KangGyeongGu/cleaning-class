create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'quote_form_click',
    'quote_form_success',
    'quote_form_error',
    'phone_click',
    'cta_click',
    'review_card_click',
    'sns_click',
    'faq_open',
    'review_filter',
    'page_landing'
  )),
  event_payload jsonb not null default '{}'::jsonb,
  path text not null,
  ip_hash text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index analytics_events_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create index analytics_events_created_at_idx
  on public.analytics_events (created_at);

create index analytics_events_rate_limit_idx
  on public.analytics_events (ip_hash, event_type, created_at);

alter table public.analytics_events enable row level security;

create policy "analytics_events_insert_anon"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

create policy "analytics_events_select_authenticated"
  on public.analytics_events
  for select
  to authenticated
  using (true);

comment on table public.analytics_events is '원본 이벤트 로그 — 90일 retention (pg_cron 자동 삭제). PII 미저장 (ip_hash 만).';
comment on column public.analytics_events.event_type is 'CHECK constraint 로 10종 enum 강제. TS Zod 와 이중 방어.';
comment on column public.analytics_events.ip_hash is 'sha256(ip + APP_SECRET). 원본 IP 미저장.';
