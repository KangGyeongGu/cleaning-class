import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockGetData = vi.hoisted(() => vi.fn());
const mockGetSummary = vi.hoisted(() => vi.fn());
const mockGetDaily = vi.hoisted(() => vi.fn());
const mockGetTraffic = vi.hoisted(() => vi.fn());
const mockGetDevice = vi.hoisted(() => vi.fn());
const mockGetTop = vi.hoisted(() => vi.fn());
const mockGetRegion = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));
vi.mock("@/shared/lib/queries/analytics", () => ({
  getAnalyticsData: mockGetData,
  getAnalyticsSummary: mockGetSummary,
  getAnalyticsDailyVisitors: mockGetDaily,
  getAnalyticsTrafficSources: mockGetTraffic,
  getAnalyticsDevice: mockGetDevice,
  getAnalyticsTopPages: mockGetTop,
  getAnalyticsRegion: mockGetRegion,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
});

describe("refreshAllAnalytics", () => {
  it("returns data on success", async () => {
    mockGetData.mockResolvedValue({ summary: { activeUsers: 10 } });
    const { refreshAllAnalytics } = await import("@/shared/actions/analytics");
    const result = await refreshAllAnalytics();
    expect(result).toEqual({ summary: { activeUsers: 10 } });
  });

  it("returns null when getUser throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValue(new Error("unauth"));
    const { refreshAllAnalytics } = await import("@/shared/actions/analytics");
    expect(await refreshAllAnalytics()).toBeNull();
    expect(mockGetData).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null when getAnalyticsData throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetData.mockRejectedValue(new Error("GA error"));
    const { refreshAllAnalytics } = await import("@/shared/actions/analytics");
    expect(await refreshAllAnalytics()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("logs raw error when not Error instance", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetData.mockRejectedValue("string error");
    const { refreshAllAnalytics } = await import("@/shared/actions/analytics");
    await refreshAllAnalytics();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("refreshSummary", () => {
  it("returns summary on success", async () => {
    mockGetSummary.mockResolvedValue({
      summary: { sessions: 1 },
      conversionEvents: [],
      lastUpdated: "x",
    });
    const { refreshSummary } = await import("@/shared/actions/analytics");
    const r = await refreshSummary();
    expect(r?.summary).toBeDefined();
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSummary.mockRejectedValue(new Error("x"));
    const { refreshSummary } = await import("@/shared/actions/analytics");
    expect(await refreshSummary()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("refreshDailyVisitors", () => {
  it("returns data on success", async () => {
    mockGetDaily.mockResolvedValue([
      { date: "2026-01-01", activeUsers: 1, sessions: 1 },
    ]);
    const { refreshDailyVisitors } = await import("@/shared/actions/analytics");
    expect(await refreshDailyVisitors()).toHaveLength(1);
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDaily.mockRejectedValue(new Error("x"));
    const { refreshDailyVisitors } = await import("@/shared/actions/analytics");
    expect(await refreshDailyVisitors()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("refreshTrafficSources", () => {
  it("returns data on success", async () => {
    mockGetTraffic.mockResolvedValue([{ channel: "Direct", sessions: 5 }]);
    const { refreshTrafficSources } =
      await import("@/shared/actions/analytics");
    expect(await refreshTrafficSources()).toHaveLength(1);
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetTraffic.mockRejectedValue(new Error("x"));
    const { refreshTrafficSources } =
      await import("@/shared/actions/analytics");
    expect(await refreshTrafficSources()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("refreshDevice", () => {
  it("returns data on success", async () => {
    mockGetDevice.mockResolvedValue({
      deviceBreakdown: [],
      deviceDetail: [],
      browserBreakdown: [],
    });
    const { refreshDevice } = await import("@/shared/actions/analytics");
    expect(await refreshDevice()).toBeDefined();
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDevice.mockRejectedValue(new Error("x"));
    const { refreshDevice } = await import("@/shared/actions/analytics");
    expect(await refreshDevice()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("refreshTopPages", () => {
  it("returns data on success", async () => {
    mockGetTop.mockResolvedValue([{ path: "/", views: 100 }]);
    const { refreshTopPages } = await import("@/shared/actions/analytics");
    expect(await refreshTopPages()).toHaveLength(1);
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetTop.mockRejectedValue(new Error("x"));
    const { refreshTopPages } = await import("@/shared/actions/analytics");
    expect(await refreshTopPages()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("refreshRegion", () => {
  it("returns data on success", async () => {
    mockGetRegion.mockResolvedValue([
      { region: "서울", city: "강남", users: 5 },
    ]);
    const { refreshRegion } = await import("@/shared/actions/analytics");
    expect(await refreshRegion()).toHaveLength(1);
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetRegion.mockRejectedValue(new Error("x"));
    const { refreshRegion } = await import("@/shared/actions/analytics");
    expect(await refreshRegion()).toBeNull();
    consoleSpy.mockRestore();
  });
});
