create or replace function public.submit_public_review(
  p_rating       numeric,
  p_comment      text,
  p_nickname     text default '익명',
  p_service_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review_id uuid;
begin
  insert into customer_reviews (rating, comment, nickname, service_type)
  values (
    p_rating,
    p_comment,
    coalesce(nullif(trim(p_nickname), ''), '익명'),
    p_service_type
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;
