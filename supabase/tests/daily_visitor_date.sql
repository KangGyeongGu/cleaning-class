begin;
set local plpgsql.check_asserts = on;

do $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  yesterday date := today - 1;
  old_key text := md5(random()::text) || md5(random()::text);
  new_key text := md5(random()::text) || md5(random()::text);
  today_before integer;
  yesterday_before integer;
  invalid_date date;
  rejected boolean;
begin
  today_before := coalesce((select count from public.analytics_daily
    where date=today and event_type='daily_unique_visitor' and dimension=''),0);
  yesterday_before := coalesce((select count from public.analytics_daily
    where date=yesterday and event_type='daily_unique_visitor' and dimension=''),0);

  perform public.record_daily_visitor(old_key,yesterday);
  perform public.record_daily_visitor(old_key,yesterday);
  perform public.record_daily_visitor(new_key,today);
  perform public.record_daily_visitor(new_key,today);

  assert (select count from public.analytics_daily
    where date=yesterday and event_type='daily_unique_visitor' and dimension='') = yesterday_before + 1,
    'Delayed pre-midnight request must count once on its original date';
  assert (select count from public.analytics_daily
    where date=today and event_type='daily_unique_visitor' and dimension='') = today_before + 1,
    'Next day request must count once on the new date';
  assert (select count(*) from public.analytics_daily_visitors where visitor_key in (old_key,new_key))=2,
    'Duplicate requests must not add extra visitor keys';
  assert to_regprocedure('public.record_daily_visitor(text)') is null,
    'Legacy function must not remain callable';
  assert not has_function_privilege('anon','public.record_daily_visitor(text,date)','EXECUTE');
  assert not has_function_privilege('authenticated','public.record_daily_visitor(text,date)','EXECUTE');
  assert has_function_privilege('service_role','public.record_daily_visitor(text,date)','EXECUTE');

  foreach invalid_date in array array[null::date,today-2,today+1] loop
    rejected := false;
    begin
      perform public.record_daily_visitor(new_key,invalid_date);
    exception when raise_exception then
      rejected := true;
    end;
    assert rejected, 'Invalid visit date must be rejected';
  end loop;
end;
$$;

rollback;
