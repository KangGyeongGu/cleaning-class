import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRunReport = vi.hoisted(() => vi.fn());

vi.mock("@google-analytics/data", () => ({
  BetaAnalyticsDataClient: class {
    runReport = mockRunReport;
  },
}));

const ORIGINAL_ENV = { ...process.env };

function setEnv(
  values: Partial<
    Record<
      "GA_CLIENT_EMAIL" | "GA_PRIVATE_KEY" | "GA_PROPERTY_ID",
      string | undefined
    >
  >,
) {
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  setEnv({
    GA_CLIENT_EMAIL: "a@b.com",
    GA_PRIVATE_KEY: "key\\nwith\\nescapes",
    GA_PROPERTY_ID: "12345",
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function mockReports(values: unknown[]) {
  for (const v of values) {
    mockRunReport.mockResolvedValueOnce([v]);
  }
}

function row(
  dimensions: string[],
  metrics: string[],
): { dimensionValues: { value: string }[]; metricValues: { value: string }[] } {
  return {
    dimensionValues: dimensions.map((value) => ({ value })),
    metricValues: metrics.map((value) => ({ value })),
  };
}

describe("getAnalyticsData", () => {
  it("returns null when env missing (client email)", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ GA_CLIENT_EMAIL: undefined });
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsData()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null when env missing (private key)", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ GA_PRIVATE_KEY: undefined });
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsData()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null when env missing (property id)", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsData()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("aggregates all 9 reports on success", async () => {
    mockReports([
      { rows: [row([], ["10", "20"])] },
      { rows: [row(["20260101"], ["5", "10"])] },
      { rows: [row(["mobile"], ["100"])] },
      { rows: [row(["mobile"], ["50", "0.3", "120"])] },
      { rows: [row(["Chrome"], ["80"])] },
      { rows: [row(["Direct"], ["30"])] },
      { rows: [row(["/"], ["200"])] },
      {
        rows: [row(["phone_click"], ["7"]), row(["generate_lead"], ["3"])],
      },
      { rows: [row(["서울", "강남구"], ["15"])] },
    ]);
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsData();
    expect(result).not.toBeNull();
    expect(result?.summary).toEqual({
      activeUsers: 10,
      sessions: 20,
      phoneClicks: 7,
      formSubmissions: 3,
    });
    expect(result?.dailyVisitors[0].date).toBe("2026-01-01");
    expect(result?.regionBreakdown[0]).toEqual({
      region: "서울",
      city: "강남구",
      users: 15,
    });
  });

  it("handles missing rows defensively", async () => {
    mockReports([{}, {}, {}, {}, {}, {}, {}, {}, {}]);
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsData();
    expect(result?.summary.activeUsers).toBe(0);
    expect(result?.dailyVisitors).toEqual([]);
  });

  it("uses fallback empty values when all dimensionValues undefined", async () => {
    mockReports([
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
      { rows: [{}] },
    ]);
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsData();
    expect(result?.topPages[0]).toEqual({ path: "", views: 0 });
    expect(result?.regionBreakdown[0]).toEqual({
      region: "",
      city: "",
      users: 0,
    });
  });

  it("handles unformatted date string (length !== 8)", async () => {
    mockReports([
      { rows: [row([], ["1", "2"])] },
      { rows: [row(["abc"], ["1", "1"])] },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
    ]);
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsData();
    expect(result?.dailyVisitors[0].date).toBe("abc");
  });

  it("returns null on Error with stack", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("GA failure"));
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsData()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw (string)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("string err");
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsData()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("treats NaN string values as 0", async () => {
    mockReports([
      { rows: [row([], ["nope", "also-bad"])] },
      {},
      {},
      { rows: [row(["mobile"], ["x", "y", "z"])] },
      {},
      {},
      {},
      {},
      {},
    ]);
    const { getAnalyticsData } = await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsData();
    expect(result?.summary.activeUsers).toBe(0);
    expect(result?.deviceDetail[0].bounceRate).toBe(0);
  });
});

describe("getAnalyticsSummary", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsSummary()).toBeNull();
  });

  it("returns summary + conversionEvents on success", async () => {
    mockReports([
      { rows: [row([], ["10", "20"])] },
      {
        rows: [row(["phone_click"], ["3"]), row(["generate_lead"], ["2"])],
      },
    ]);
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsSummary();
    expect(result?.summary.phoneClicks).toBe(3);
    expect(result?.summary.formSubmissions).toBe(2);
  });

  it("falls back to 0 when conversion events missing entries", async () => {
    mockReports([{ rows: [row([], ["10", "20"])] }, { rows: [] }]);
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    const result = await getAnalyticsSummary();
    expect(result?.summary.phoneClicks).toBe(0);
    expect(result?.summary.formSubmissions).toBe(0);
  });

  it("uses fallback empty event name when dimensionValues missing", async () => {
    mockReports([{ rows: [row([], ["1", "2"])] }, { rows: [{}] }]);
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsSummary();
    expect(r?.conversionEvents[0]).toEqual({ eventName: "", count: 0 });
  });

  it("uses [] fallback when conversionResult rows undefined", async () => {
    mockReports([{ rows: [row([], ["1", "2"])] }, {}]);
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsSummary();
    expect(r?.conversionEvents).toEqual([]);
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsSummary()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsSummary } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsSummary()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("getAnalyticsDailyVisitors", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDailyVisitors()).toBeNull();
  });

  it("returns mapped rows on success", async () => {
    mockReports([{ rows: [row(["20260201"], ["3", "5"])] }]);
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsDailyVisitors();
    expect(r?.[0].date).toBe("2026-02-01");
  });

  it("returns [] when rows missing", async () => {
    mockReports([{}]);
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDailyVisitors()).toEqual([]);
  });

  it("uses fallback empty values when dimensionValues undefined", async () => {
    mockReports([{ rows: [{}] }]);
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsDailyVisitors();
    expect(r?.[0]).toEqual({ date: "", activeUsers: 0, sessions: 0 });
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDailyVisitors()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsDailyVisitors } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDailyVisitors()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("getAnalyticsTrafficSources", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTrafficSources()).toBeNull();
  });

  it("returns mapped rows on success", async () => {
    mockReports([{ rows: [row(["Organic"], ["50"])] }]);
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsTrafficSources();
    expect(r?.[0]).toEqual({ channel: "Organic", sessions: 50 });
  });

  it("returns [] when rows missing", async () => {
    mockReports([{}]);
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTrafficSources()).toEqual([]);
  });

  it("uses fallback empty values when dimensionValues undefined", async () => {
    mockReports([{ rows: [{}] }]);
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTrafficSources()).toEqual([
      { channel: "", sessions: 0 },
    ]);
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTrafficSources()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsTrafficSources } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTrafficSources()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("getAnalyticsDevice", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDevice()).toBeNull();
  });

  it("returns 3 breakdowns on success", async () => {
    mockReports([
      { rows: [row(["mobile"], ["10"])] },
      { rows: [row(["mobile"], ["20", "0.5", "100"])] },
      { rows: [row(["Chrome"], ["30"])] },
    ]);
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsDevice();
    expect(r?.deviceBreakdown).toHaveLength(1);
    expect(r?.deviceDetail[0].bounceRate).toBe(0.5);
    expect(r?.browserBreakdown).toHaveLength(1);
  });

  it("handles all-empty rows", async () => {
    mockReports([{}, {}, {}]);
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsDevice();
    expect(r?.deviceBreakdown).toEqual([]);
  });

  it("uses fallback empty values when dimensionValues/metricValues undefined", async () => {
    mockReports([{ rows: [{}] }, { rows: [{}] }, { rows: [{}] }]);
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsDevice();
    expect(r?.browserBreakdown[0]).toEqual({ browser: "", users: 0 });
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDevice()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsDevice } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsDevice()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("getAnalyticsTopPages", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toBeNull();
  });

  it("returns mapped rows", async () => {
    mockReports([{ rows: [row(["/foo"], ["42"])] }]);
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toEqual([{ path: "/foo", views: 42 }]);
  });

  it("returns [] when rows missing", async () => {
    mockReports([{}]);
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toEqual([]);
  });

  it("uses fallback empty values when dimensionValues undefined", async () => {
    mockReports([{ rows: [{}] }]);
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toEqual([{ path: "", views: 0 }]);
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsTopPages } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsTopPages()).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("getAnalyticsRegion", () => {
  it("returns null when config invalid", async () => {
    setEnv({ GA_PROPERTY_ID: undefined });
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsRegion()).toBeNull();
  });

  it("returns mapped rows", async () => {
    mockReports([{ rows: [row(["서울", "강남"], ["10"])] }]);
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    const r = await getAnalyticsRegion();
    expect(r?.[0]).toEqual({ region: "서울", city: "강남", users: 10 });
  });

  it("returns [] when rows missing", async () => {
    mockReports([{}]);
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsRegion()).toEqual([]);
  });

  it("uses fallback empty values when dimensionValues undefined", async () => {
    mockReports([{ rows: [{}] }]);
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsRegion()).toEqual([
      { region: "", city: "", users: 0 },
    ]);
  });

  it("returns null on Error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue(new Error("x"));
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsRegion()).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on non-Error throw", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRunReport.mockRejectedValue("oops");
    const { getAnalyticsRegion } =
      await import("@/shared/lib/queries/analytics");
    expect(await getAnalyticsRegion()).toBeNull();
    consoleSpy.mockRestore();
  });
});
