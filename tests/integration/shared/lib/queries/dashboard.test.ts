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

function kstCreatedAt(date: string, hour = 10): string {
  return `${date}T${String(hour).padStart(2, "0")}:00:00+09:00`;
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

describe("getTodayStats", () => {
  it("aggregates today's events with cleaning/moving segmentation", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { event_type: "page_landing", event_payload: { source: "naver" } },
        { event_type: "page_landing", event_payload: null },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "moving" },
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "cleaning" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "moving" },
        },
        { event_type: "cta_click", event_payload: { content_id: "x" } },
      ],
      error: null,
    });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    expect(await getTodayStats()).toEqual({
      visitors: 2,
      quoteSubmissions: { cleaning: 2, moving: 1 },
      phoneClicks: { cleaning: 1, moving: 1 },
    });
  });

  it("ignores unknown segment values", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "other" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "other" },
        },
      ],
      error: null,
    });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    expect(await getTodayStats()).toEqual({
      visitors: 0,
      quoteSubmissions: { cleaning: 0, moving: 0 },
      phoneClicks: { cleaning: 0, moving: 0 },
    });
  });

  it("returns zeros on null data", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    expect(await getTodayStats()).toEqual({
      visitors: 0,
      quoteSubmissions: { cleaning: 0, moving: 0 },
      phoneClicks: { cleaning: 0, moving: 0 },
    });
  });

  it("returns zeros and logs on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    const r = await getTodayStats();
    expect(r.visitors).toBe(0);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("getDailyTrend7d", () => {
  it("groups raw events by KST date with cleaning/moving segmentation", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          event_type: "page_landing",
          event_payload: { source: "naver" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "page_landing",
          event_payload: null,
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "moving" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "cleaning" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "moving" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
          created_at: kstCreatedAt("2026-06-04"),
        },
        {
          event_type: "unmatched_event",
          event_payload: null,
          created_at: kstCreatedAt("2026-06-04"),
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
      visitors: 2,
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

  it("ignores unknown segments and dates outside the 7-day window", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "unknown" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "unknown" },
          created_at: kstCreatedAt("2026-06-05"),
        },
        {
          event_type: "page_landing",
          event_payload: null,
          created_at: kstCreatedAt("2099-12-31"),
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
});

describe("getTrafficSources30d", () => {
  it("counts raw page_landing events by source and sorts desc", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { event_payload: { source: "google" } },
        { event_payload: { source: "naver" } },
        { event_payload: { source: "naver" } },
        { event_payload: { source: "naver" } },
        { event_payload: { source: "google" } },
        { event_payload: { source: "" } },
        { event_payload: null },
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
});

describe("getCustomerActions30d", () => {
  it("counts raw events by event_type x segment", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "moving" },
        },
        {
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "unknown" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "cleaning" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "cleaning" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "moving" },
        },
        {
          event_type: "phone_click",
          event_payload: { phone_type: "unknown" },
        },
        {
          event_type: "unmatched_event",
          event_payload: null,
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
