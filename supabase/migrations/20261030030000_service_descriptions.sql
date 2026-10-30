DO $migration$
DECLARE
  content record;
  matched integer;
  changed integer;
  total_changed integer := 0;
BEGIN
  LOCK TABLE public.services IN SHARE ROW EXCLUSIVE MODE;

  FOR content IN
    SELECT * FROM (VALUES
  ('cleaning', '거주청소', '입주·이사·퇴거 청소부터 현재 생활 중인 집의 전체청소까지 제공합니다. 주방·화장실·베란다·유리창·창틀·바닥을 청소하며, 주방이나 화장실 한 곳만 맡기는 부분청소, 냉장고 음식물 비우기와 내부 세척도 각각 이용할 수 있습니다.'),
  ('cleaning', '정기청소', '사무실·상가·학원·기숙사와 건물 공용공간을 정기적으로 관리합니다. 실내 바닥과 유리창, 계단·복도·난간·엘리베이터, 공용 화장실·샤워실·세탁실을 청소하며, 먼지·거미줄·낙엽 제거와 휴지통 비우기 등 반복적으로 필요한 작업을 제공합니다.'),
  ('cleaning', '특수청소', '흡연으로 누렇게 변한 천장·벽면·환풍기의 니코틴, 욕실·베란다의 곰팡이, 주방·후드에 굳은 기름때처럼 일반적인 청소로 제거하기 어려운 오염을 다룹니다. 오염과 표면 재질에 맞는 전용 약품과 장비를 사용하며, 특정 공간이나 오염 부위만 집중적으로 청소할 수도 있습니다.'),
  ('cleaning', '쓰레기집청소', '음식물·배달용기·생활쓰레기가 쌓인 집의 분류·배출과 청소를 제공합니다. 침대·장롱·책상 등 대형 폐가구 처리, 이사 후 남은 짐 정리와 집 비우기도 가능합니다. 집 전체가 아니어도 방이나 베란다의 폐기물만 처리하거나, 청소 없이 쓰레기 배출만 맡길 수 있습니다.'),
  ('cleaning', '상가청소', '매장·음식점·카페·사무실의 전체청소와 필요한 부위의 부분청소를 제공합니다. 유리창·창틀·어닝·간판의 오염과 거미줄 제거, 유리 시트지·스티커·본드 자국 제거, 주방·후드 기름때 청소, 화장실 청소와 바닥 타일 세정·왁스코팅을 맡길 수 있습니다.'),
  ('moving', '원룸이사', '원룸·오피스텔·자취방 등 짐이 적은 가구의 소규모 이사입니다. 옷·책·생활용품을 담은 박스부터 침대·책상·냉장고·세탁기 등 가구와 가전까지 옮깁니다.'),
  ('moving', '일반이사', '고객이 미리 포장한 생활용품과 가구·가전을 새집으로 옮기는 이사입니다. 이삿짐의 운송은 업체가 맡고, 옷·식기·책 등 개인 물품의 포장과 도착 후 짐 풀기·정리는 고객이 직접 합니다.'),
  ('moving', '반포장이사', '침대·장롱·냉장고·세탁기 등 큰 짐의 포장과 운반은 업체가 맡습니다. 옷·식기·책·생활용품 등 작은 짐은 고객이 포장하고, 도착 후 개인 물품을 풀어 정리하는 이사 방식입니다.'),
  ('moving', '포장이사', '옷·식기·책 등 생활용품부터 큰 가구와 가전까지 업체가 포장하고 운반합니다. 새집에서 포장을 풀고 가구·가전을 배치하며 생활용품을 정리하는 작업까지 맡기는 이사 방식입니다.'),
  ('moving', '부분이사', '집 전체가 아닌 냉장고·세탁기·침대·소파 등 일부 물품이나 소량의 짐을 옮기는 서비스입니다. 중고거래로 구입한 가구·가전 배송, 가족에게 물려줄 가구 운반, 다른 장소로 보내야 하는 짐의 이동에 이용할 수 있습니다.')
    ) AS descriptions(category, title, description)
  LOOP
    SELECT count(*) INTO matched
    FROM public.services
    WHERE category = content.category AND title = content.title;

    IF matched <> 1 THEN
      RAISE EXCEPTION 'Expected exactly one service for % / %, found %', content.category, content.title, matched;
    END IF;

    UPDATE public.services
    SET description = content.description, updated_at = now()
    WHERE category = content.category AND title = content.title
      AND description IS DISTINCT FROM content.description;

    GET DIAGNOSTICS changed = ROW_COUNT;
    total_changed := total_changed + changed;

    IF NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE category = content.category AND title = content.title
        AND description = content.description
    ) THEN
      RAISE EXCEPTION 'Description verification failed for % / %', content.category, content.title;
    END IF;
  END LOOP;

  RAISE NOTICE 'Verified 10 service descriptions; updated % rows', total_changed;
END;
$migration$;
