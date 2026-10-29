import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardSnapshot } from "@/shared/lib/queries/dashboard";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  page: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc, from: mocks.from }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T00:00:00Z"));
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "gte", "lte", "lt", "in", "order"])
    chain[method] = vi.fn(() => chain);
  chain.range = mocks.page;
  mocks.from.mockReturnValue(chain);
});
afterEach(() => vi.useRealTimers());

const row = {
  date: "2026-10-29",
  visitors: 2,
  phoneCleaning: 3,
  phoneMoving: 1,
  quoteCleaning: 4,
  quoteMoving: 0,
};

describe("getDashboardSnapshot", () => {
  it("조회 기간을 RPC에 전달하고 검증한 결과를 반환", async () => {
    mocks.rpc.mockResolvedValue({ data: [row], error: null });
    expect(await getDashboardSnapshot("2026-10-29", "2026-10-29")).toEqual({
      rows: [row],
      updatedAt: "2026-10-29T00:00:00.000Z",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("dashboard_snapshot", {
      p_start: "2026-10-29",
      p_end: "2026-10-29",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("잘못된 기간은 DB 요청 전에 거부", async () => {
    await expect(
      getDashboardSnapshot("2026-04-28", "2026-10-29"),
    ).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("권한 오류와 잘못된 응답을 0으로 숨기지 않음", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: { code: "42501" } })
      .mockResolvedValueOnce({ data: [{}], error: null });
    await expect(
      getDashboardSnapshot("2026-10-29", "2026-10-29"),
    ).rejects.toThrow("42501");
    await expect(
      getDashboardSnapshot("2026-10-29", "2026-10-29"),
    ).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("RPC가 없을 때만 기존 활동 조회로 대체하며 다음 페이지도 조회", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    mocks.page
      .mockResolvedValueOnce({
        data: [
          {
            date: "2026-10-28",
            event_type: "phone_click",
            dimension: "cleaning",
            count: 5,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, () => ({
          created_at: "2026-10-29T00:00:00Z",
          event_type: "phone_click",
          event_payload: { phone_type: "moving" },
        })),
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });
    const result = await getDashboardSnapshot("2026-10-28", "2026-10-29");
    expect(result.rows[0]).toMatchObject({ visitors: null, phoneCleaning: 5 });
    expect(result.rows[1]).toMatchObject({ visitors: null, phoneMoving: 1000 });
    expect(mocks.page.mock.calls).toEqual([
      [0, 999],
      [0, 999],
      [1000, 1999],
    ]);
  });
  it("일별 집계 조회도 페이지 제한 이후까지 조회", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    mocks.page
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, () => ({
          date: "2026-10-29",
          event_type: "phone_click",
          dimension: "cleaning",
          count: 5,
        })),
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    expect(
      (await getDashboardSnapshot("2026-10-29", "2026-10-29")).rows[0]
        .phoneCleaning,
    ).toBe(5);
    expect(mocks.page).toHaveBeenCalledTimes(3);
  });
  it("기존 자료 조회 오류를 전달하고 null 자료는 빈 활동으로 처리", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    mocks.page.mockResolvedValueOnce({
      data: null,
      error: { code: "DAILY_ERROR" },
    });
    await expect(
      getDashboardSnapshot("2026-10-29", "2026-10-29"),
    ).rejects.toThrow("DAILY_ERROR");
    mocks.page
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "RAW_ERROR" } });
    await expect(
      getDashboardSnapshot("2026-10-29", "2026-10-29"),
    ).rejects.toThrow("RAW_ERROR");
    mocks.page.mockResolvedValue({ data: null, error: null });
    expect(
      (await getDashboardSnapshot("2026-10-29", "2026-10-29")).rows,
    ).toEqual([
      {
        ...row,
        visitors: null,
        phoneCleaning: 0,
        phoneMoving: 0,
        quoteCleaning: 0,
      },
    ]);
  });
});
