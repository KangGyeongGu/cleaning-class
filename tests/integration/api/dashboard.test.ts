import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/admin/dashboard/route";

const mocks = vi.hoisted(() => ({ user: vi.fn(), snapshot: vi.fn() }));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mocks.user }));
vi.mock("@/shared/lib/queries/dashboard", () => ({
  getDashboardSnapshot: mocks.snapshot,
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T00:00:00Z"));
  mocks.user.mockResolvedValue({ id: "admin" });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const request = (query = "") =>
  new Request(`https://www.cleaningclass.co.kr/api/admin/dashboard${query}`);

describe("대시보드 조회 API", () => {
  it("로그인하지 않은 요청을 거부하고 통계를 조회하지 않음", async () => {
    mocks.user.mockRejectedValue(new Error("unauthorized"));
    expect((await GET(request())).status).toBe(401);
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });
  it("보관 범위를 벗어난 조회를 거부", async () => {
    expect(
      (await GET(request("?start=2026-04-28&end=2026-10-29"))).status,
    ).toBe(400);
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });
  it("기본 7일과 직접 선택한 기간을 조회하고 캐시를 금지", async () => {
    const snapshot = { rows: [], updatedAt: "2026-10-29T00:00:00Z" };
    mocks.snapshot.mockResolvedValue(snapshot);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual(snapshot);
    expect(mocks.snapshot).toHaveBeenCalledWith("2026-10-23", "2026-10-29");
    await GET(request("?start=2026-09-01&end=2026-09-30"));
    expect(mocks.snapshot).toHaveBeenLastCalledWith("2026-09-01", "2026-09-30");
  });
  it("DB 오류를 빈 통계로 응답하지 않음", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.snapshot.mockRejectedValue(new Error("DB down"));
    expect((await GET(request())).status).toBe(503);
  });
});
