drop index if exists public.analytics_events_rate_limit_idx;
alter table public.analytics_events drop column if exists ip_hash;
alter table public.analytics_events drop column if exists user_agent;
