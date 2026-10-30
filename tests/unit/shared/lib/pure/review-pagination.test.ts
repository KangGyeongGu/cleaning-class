import { describe, expect, it } from "vitest";
import { reviewQuery } from "@/shared/lib/pure/review-pagination";

describe("작업 사례 조회 조건", () => {
  it("기본 조건과 알려진 카테고리만 사용", () => {
    expect(reviewQuery("")).toEqual({ filter: null, page: 1 });
    expect(reviewQuery("filter=정기청소&page=2")).toEqual({
      filter: "정기청소",
      page: 2,
    });
    expect(reviewQuery("filter=invalid&page=999999")).toEqual({
      filter: null,
      page: 999999,
    });
  });
  it.each(["0", "-1", "1.5", "NaN", "Infinity", "9007199254740992"])(
    "잘못된 페이지 %s는 첫 페이지",
    (page) => {
      expect(reviewQuery(`page=${page}`).page).toBe(1);
    },
  );
});
