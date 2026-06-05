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

describe("getTodayStats", () => {
  it("aggregates today's event counts", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { event_type: "page_landing" },
        { event_type: "page_landing" },
        { event_type: "quote_form_click" },
        { event_type: "quote_form_success" },
        { event_type: "phone_click" },
        { event_type: "phone_click" },
        { event_type: "phone_click" },
      ],
      error: null,
    });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    expect(await getTodayStats()).toEqual({
      landings: 2,
      quoteClicks: 1,
      quoteSuccess: 1,
      phoneClicks: 3,
    });
  });

  it("returns zeros on null data", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    expect(await getTodayStats()).toEqual({
      landings: 0,
      quoteClicks: 0,
      quoteSuccess: 0,
      phoneClicks: 0,
    });
  });

  it("returns zeros and logs on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getTodayStats } = await import("@/shared/lib/queries/dashboard");
    const r = await getTodayStats();
    expect(r).toEqual({
      landings: 0,
      quoteClicks: 0,
      quoteSuccess: 0,
      phoneClicks: 0,
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("getQuoteFunnel7d", () => {
  it("merges 7 days with zero defaults and accumulates by event_type", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { date: "2026-06-05", event_type: "page_landing", count: 30 },
        { date: "2026-06-05", event_type: "quote_form_click", count: 5 },
        { date: "2026-06-05", event_type: "quote_form_success", count: 2 },
        { date: "2026-06-04", event_type: "page_landing", count: 20 },
        { date: "2026-06-04", event_type: "quote_form_click", count: 3 },
        { date: "2026-06-03", event_type: "unmatched_event", count: 7 },
        { date: "2099-12-31", event_type: "page_landing", count: 999 },
      ],
      error: null,
    });
    const { getQuoteFunnel7d } = await import("@/shared/lib/queries/dashboard");
    const rows = await getQuoteFunnel7d();
    expect(rows).toHaveLength(7);
    const today = rows.find((r) => r.date === "2026-06-05");
    expect(today).toEqual({
      date: "2026-06-05",
      landings: 30,
      clicks: 5,
      success: 2,
    });
    const yesterday = rows.find((r) => r.date === "2026-06-04");
    expect(yesterday).toEqual({
      date: "2026-06-04",
      landings: 20,
      clicks: 3,
      success: 0,
    });
    const empty = rows.find((r) => r.date === "2026-06-01");
    expect(empty).toEqual({
      date: "2026-06-01",
      landings: 0,
      clicks: 0,
      success: 0,
    });
  });

  it("returns empty array on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getQuoteFunnel7d } = await import("@/shared/lib/queries/dashboard");
    expect(await getQuoteFunnel7d()).toEqual([]);
    spy.mockRestore();
  });

  it("handles null data without throwing", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getQuoteFunnel7d } = await import("@/shared/lib/queries/dashboard");
    const rows = await getQuoteFunnel7d();
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.landings === 0)).toBe(true);
  });
});

describe("getTrafficSources30d", () => {
  it("sums dimension counts and sorts desc", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { dimension: "google", count: 10 },
        { dimension: "naver", count: 25 },
        { dimension: "google", count: 5 },
        { dimension: "", count: 3 },
      ],
      error: null,
    });
    const { getTrafficSources30d } =
      await import("@/shared/lib/queries/dashboard");
    const rows = await getTrafficSources30d();
    expect(rows[0]).toEqual({ source: "naver", count: 25 });
    expect(rows[1]).toEqual({ source: "google", count: 15 });
    expect(rows[2]).toEqual({ source: "direct", count: 3 });
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

describe("getEventCounts30d", () => {
  it("sums by event_type and sorts desc", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({
      data: [
        { event_type: "page_landing", count: 50 },
        { event_type: "page_landing", count: 30 },
        { event_type: "phone_click", count: 12 },
        { event_type: "quote_form_click", count: 5 },
      ],
      error: null,
    });
    const { getEventCounts30d } =
      await import("@/shared/lib/queries/dashboard");
    const rows = await getEventCounts30d();
    expect(rows[0]).toEqual({ event_type: "page_landing", count: 80 });
    expect(rows[1]).toEqual({ event_type: "phone_click", count: 12 });
    expect(rows[2]).toEqual({ event_type: "quote_form_click", count: 5 });
  });

  it("returns [] on error", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFinal.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    const { getEventCounts30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getEventCounts30d()).toEqual([]);
    spy.mockRestore();
  });

  it("returns [] on null data", async () => {
    fixDateTo("2026-06-05T05:00:00.000Z");
    mockFinal.mockResolvedValueOnce({ data: null, error: null });
    const { getEventCounts30d } =
      await import("@/shared/lib/queries/dashboard");
    expect(await getEventCounts30d()).toEqual([]);
  });
});
