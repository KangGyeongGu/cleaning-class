import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  cache: vi.fn((fn: unknown) => fn),
}));
vi.mock("next/cache", () => ({ unstable_cache: mocks.cache }));
vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: () => ({ from: mocks.from }),
}));
import { getPublishedReviewPage } from "@/shared/lib/queries/review-page";

function chain(result: {
  data?: unknown;
  count?: number | null;
  error: unknown;
}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    then: Promise.resolve(result).then.bind(Promise.resolve(result)),
  };
  for (const method of [
    query.select,
    query.eq,
    query.contains,
    query.order,
    query.range,
  ])
    method.mockReturnValue(query);
  return query;
}
beforeEach(() => {
  mocks.from.mockReset();
});

describe("캐시된 공개 작업 사례 목록", () => {
  it("전체 건수를 조회하고 첫 12개만 가져옴", async () => {
    const count = chain({ count: 518, error: null });
    const rows = chain({ data: [{ id: "first" }], error: null });
    mocks.from.mockReturnValueOnce(count).mockReturnValueOnce(rows);
    expect(await getPublishedReviewPage()).toEqual({
      reviews: [{ id: "first" }],
      total: 518,
      page: 1,
      filter: null,
    });
    expect(rows.range).toHaveBeenCalledWith(0, 11);
    expect(count.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(rows.order).toHaveBeenCalledWith("id", { ascending: false });
  });
  it("필터 조건은 건수와 목록 모두 적용하고 초과 페이지는 마지막 페이지", async () => {
    const count = chain({ count: 14, error: null });
    const rows = chain({ data: null, error: null });
    mocks.from.mockReturnValueOnce(count).mockReturnValueOnce(rows);
    expect(await getPublishedReviewPage("정기청소", 10000)).toEqual({
      reviews: [],
      total: 14,
      page: 2,
      filter: "정기청소",
    });
    expect(count.contains).toHaveBeenCalledWith("tags", ["정기청소"]);
    expect(rows.contains).toHaveBeenCalledWith("tags", ["정기청소"]);
    expect(rows.range).toHaveBeenCalledWith(12, 23);
  });
  it("빈 결과는 첫 페이지로 유지", async () => {
    mocks.from
      .mockReturnValueOnce(chain({ count: 0, error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }));
    expect((await getPublishedReviewPage(null, 10)).page).toBe(1);
  });
  it("건수 조회 오류와 집계 누락을 정상 빈 목록으로 캐시하지 않음", async () => {
    const error = new Error("count failed");
    mocks.from.mockReturnValueOnce(chain({ error }));
    await expect(getPublishedReviewPage()).rejects.toBe(error);
    mocks.from.mockReturnValueOnce(chain({ count: null, error: null }));
    await expect(getPublishedReviewPage()).rejects.toThrow("건수");
  });
  it("목록 조회 실패를 전파", async () => {
    const error = new Error("rows failed");
    mocks.from
      .mockReturnValueOnce(chain({ count: 10, error: null }))
      .mockReturnValueOnce(chain({ error }));
    await expect(getPublishedReviewPage()).rejects.toBe(error);
  });
});
