import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/shared/lib/queries/review-page", () => ({
  getPublishedReviewPage: mocks.query,
}));
import { GET } from "@/app/api/reviews/route";
beforeEach(() => {
  mocks.query.mockReset();
});
describe("공개 작업 사례 API", () => {
  it("서버에서 조회하고 브라우저 캐시 없이 응답", async () => {
    mocks.query.mockResolvedValue({
      reviews: [],
      total: 0,
      page: 1,
      filter: "정기청소",
    });
    const response = await GET(
      new Request("https://example.com/api/reviews?filter=정기청소&page=2"),
    );
    expect(mocks.query).toHaveBeenCalledWith("정기청소", 2);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("실패하면 오류 상태로 응답하고 빈 목록을 반환하지 않음", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.query.mockRejectedValue(new Error("offline"));
    const response = await GET(new Request("https://example.com/api/reviews"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "작업 사례를 불러오지 못했습니다.",
    });
    spy.mockRestore();
  });
});
