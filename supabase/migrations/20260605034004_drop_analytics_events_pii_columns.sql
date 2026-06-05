-- analytics_events: rate limit / PII 컬럼 제거 (필요 없음으로 판단)
-- - ip_hash: rate limit 만 사용. 청소클라쓰 트래픽엔 rate limit 자체 불필요
-- - user_agent: 봇 UA 검사는 수집 시점에 처리 (DB 저장 불필요)
drop index if exists public.analytics_events_rate_limit_idx;
alter table public.analytics_events drop column if exists ip_hash;
alter table public.analytics_events drop column if exists user_agent;
