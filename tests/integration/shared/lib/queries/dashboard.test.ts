import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type Row = Record<string, unknown>;

interface QueryResult {
  data: Row[] | null;
  error: unknown;
}

const mockFinal = vi.hoisted(() => vi.fn());

const chainFactory = vi.hoisted(() => {
  const make = (): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    const methods = ["select", "gte", "in", "eq"];
    for (const m of methods) {
      obj[m] = vi.fn(() => obj);
    }
    obj.then = (resolve: (v: QueryResult) => unknown) =>
      Promise.resolve(mockFinal()).then(resolve);
    return obj;
  };
  return { make };
});

const mockFrom = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

const REAL_DATE = Date;

function fixDateTo(iso: string): void {
  vi.setSystemTime(new REAL_DATE(iso));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.resetModules();
  mockFrom.mockImplementation(() => chainFactory.make());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getDailyTrend7d", () => {
  it("sums pre-aggregated counts by KST date with cleaning/moving segmentation", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          date: "2026-06-05",
          event_type: "page_landing",
          dimension: "naver",
          count: 2,
        },
        {
          date: "2026-06-05",
          event_type: "page_landing",
          dimension: "google",
          count: 1,
        },
        {
          date: "2026-06-05",
          event_type: "quote_form_success",
          dimension: "cleaning",
          count: 1,
        },
        {
          date: "2026-06-05",
          event_type: "quote_form_success",
          dimension: "moving",
          count: 1,
        },
        {
          date: "2026-06-05",
          event_type: "phone_click",
          dimension: "cleaning",
          count: 1,
        },
        {
          date: "2026-06-05",
          event_type: "phone_click",
          dimension: "moving",
          count: 1,
        },
        {
          date: "2026-06-04",
          event_type: "quote_form_success",
          dimension: "cleaning",
          count: 1,
        },
        {
          date: "2026-06-04",
          event_type: "cta_click",
          dimension: "navbar_contact",
          count: 3,
        },
      ],
      error: null,
    });
    const { getDailyTrend7d } = await import("@/shared/lib/queries/dashboard");
    const rows = await getDailyTrend7d();
    expect(rows).toHaveLength(7);
    const today = rows.find((r) => r.date === "2026-06-05");
    expect(today).toEqual({
      date: "2026-06-05",
      visitors: 3,
      quoteCleaning: 1,
      quoteMoving: 1,
      phoneCleaning: 1,
      phoneMoving: 1,
    });
    const yesterday = rows.find((r) => r.date === "2026-06-04");
    expect(yesterday).toEqual({
      date: "2026-06-04",
      visitors: 0,
      quoteCleaning: 1,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
  });

  it("ignores unknown dimensions and dates outside the 7-day window", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          date: "2026-06-05",
          event_type: "quote_form_success",
          dimension: "unknown",
          count: 2,
        },
        {
          date: "2026-06-05",
          event_type: "phone_click",
          dimension: "unknown",
          count: 2,
        },
        {
          date: "2099-12-31",
          event_type: "page_landing",
          dimension: "naver",
          count: 5,
        },
      ],
      error: null,
    });
    const { getDailyTrend7d } = await import("@/shared/lib/queries/dashboard");
    const today = (await getDailyTrend7d()).find(
      (r) => r.date === "2026-06-05",
    );
    expect(today).toEqual({
      date: "2026-06-05",
      visitors: 0,
      quoteCleaning: 0,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
  });

  it("returns [] on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getDailyTrend7d } = await import("@/shared/lib/queries/dashboard");
    expect(await getDailyTrend7d()).toEqual([]);
    spy.mockRestore();
  });

  it("handles null data without throwing", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getDailyTrend7d } = await import("@/shared/lib/queries/dashboard");
    const rows = await getDailyTrend7d();
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.visitors === 0)).toBe(true);
  });

  it("buckets a UTC-night event by KST date and starts the 7d window at KST", async () => {
    fixDateTo("2026-06-04T22:00:00.000Z");
    const chain = chainFactory.make();
    mockFrom.mockImplementation(() => chain);
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          date: "2026-06-05",
          event_type: "quote_form_success",
          dimension: "cleaning",
          count: 2,
        },
      ],
      error: null,
    });
    const { getDailyTrend7d } = await import("@/shared/lib/queries/dashboard");
    const rows = await getDailyTrend7d();
    expect(rows[rows.length - 1].date).toBe("2026-06-05");
    expect(rows.find((r) => r.date === "2026-06-05")).toEqual({
      date: "2026-06-05",
      visitors: 0,
      quoteCleaning: 2,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
    expect(chain.gte).toHaveBeenCalledWith("date", "2026-05-30");
  });
});

describe("getTrafficSources30d", () => {
  it("sums pre-aggregated page_landing counts by dimension and sorts desc", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { dimension: "google", count: 2 },
        { dimension: "naver", count: 1 },
        { dimension: "naver", count: 2 },
        { dimension: "", count: 1 },
        { dimension: null, count: 1 },
      ],
      error: null,
    });
    const { getTrafficSources30d } =
      await import("@/shared/lib/queries/dashboard");
    const rows = await getTrafficSources30d();
    expect(rows[0]).toEqual({ source: "naver", count: 3 });
    expect(rows.slice(1)).toEqual(
      expect.arrayContaining([
        { source: "direct", count: 2 },
        { source: "google", count: 2 },
      ]),
    );
  });

  it("returns [] on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getTrafficSources30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getTrafficSources30d()).toEqual([]);
    spy.mockRestore();
  });

  it("returns [] on null data", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getTrafficSources30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getTrafficSources30d()).toEqual([]);
  });

  it("starts the 30d window at the KST date for a UTC-night clock", async () => {
    fixDateTo("2026-06-04T22:00:00.000Z");
    const chain = chainFactory.make();
    mockFrom.mockImplementation(() => chain);
    mockFinal.mockResolvedValueOnce({ data: [], error: null });
    const { getTrafficSources30d } =
      await import("@/shared/lib/queries/dashboard");
    await getTrafficSources30d();
    expect(chain.gte).toHaveBeenCalledWith("date", "2026-05-07");
  });
});

describe("getCustomerActions30d", () => {
  it("sums pre-aggregated counts by event_type x segment", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          event_type: "quote_form_success",
          dimension: "cleaning",
          count: 1,
        },
        {
          event_type: "quote_form_success",
          dimension: "moving",
          count: 1,
        },
        {
          event_type: "quote_form_success",
          dimension: "unknown",
          count: 5,
        },
        {
          event_type: "phone_click",
          dimension: "cleaning",
          count: 2,
        },
        {
          event_type: "phone_click",
          dimension: "moving",
          count: 1,
        },
        {
          event_type: "phone_click",
          dimension: "unknown",
          count: 9,
        },
        {
          event_type: "cta_click",
          dimension: "navbar_contact",
          count: 7,
        },
      ],
      error: null,
    });
    const { getCustomerActions30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getCustomerActions30d()).toEqual({
      quoteCleaning: 1,
      quoteMoving: 1,
      phoneCleaning: 2,
      phoneMoving: 1,
    });
  });

  it("returns zeros on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getCustomerActions30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getCustomerActions30d()).toEqual({
      quoteCleaning: 0,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
    spy.mockRestore();
  });

  it("returns zeros on null data", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getCustomerActions30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getCustomerActions30d()).toEqual({
      quoteCleaning: 0,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
  });
});
