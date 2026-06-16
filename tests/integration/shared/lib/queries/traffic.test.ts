import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReaddir = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());

vi.mock("node:fs/promises", () => ({
  default: { readdir: mockReaddir, readFile: mockReadFile },
  readdir: mockReaddir,
  readFile: mockReadFile,
}));

import {
  getCloudflareDays,
  getGoAccessReport,
  filterDaysByRange,
  gaPanel,
  gaMeta,
  aggregateCloudflare,
  type GoAccessReport,
} from "@/shared/lib/queries/traffic";
import type { CloudflareDay } from "@/shared/lib/schema/traffic";

function cfDay(
  date: string,
  over: Record<string, unknown> = {},
): CloudflareDay {
  return {
    dimensions: { date },
    uniq: { uniques: 1 },
    sum: {
      requests: 1,
      bytes: 1,
      cachedRequests: 0,
      cachedBytes: 0,
      encryptedRequests: 0,
      pageViews: 1,
      threats: 0,
      countryMap: [],
      responseStatusMap: [],
      browserMap: [],
      contentTypeMap: [],
      clientHTTPVersionMap: [],
      ipClassMap: [],
      threatPathingMap: [],
      ...over,
    },
  } as CloudflareDay;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCloudflareDays", () => {
  it("reads json files and sorts ascending by date", async () => {
    mockReaddir.mockResolvedValue([
      "2026-06-15.json",
      "2026-06-14.json",
      "ignore.txt",
    ]);
    mockReadFile.mockImplementation(async (p: string) =>
      JSON.stringify(cfDay(p.includes("15") ? "2026-06-15" : "2026-06-14")),
    );

    const days = await getCloudflareDays();
    expect(days.map((d) => d.dimensions.date)).toEqual([
      "2026-06-14",
      "2026-06-15",
    ]);
  });

  it("returns [] when the directory cannot be read", async () => {
    mockReaddir.mockRejectedValue(new Error("nope"));
    expect(await getCloudflareDays()).toEqual([]);
  });

  it("skips a file that fails to read", async () => {
    mockReaddir.mockResolvedValue(["a.json"]);
    mockReadFile.mockRejectedValue(new Error("io"));
    expect(await getCloudflareDays()).toEqual([]);
  });

  it("skips content that fails schema validation", async () => {
    mockReaddir.mockResolvedValue(["a.json"]);
    mockReadFile.mockResolvedValue(JSON.stringify({ nope: true }));
    expect(await getCloudflareDays()).toEqual([]);
  });
});

describe("getGoAccessReport", () => {
  it("returns null when the report cannot be read", async () => {
    mockReadFile.mockRejectedValue(new Error("missing"));
    expect(await getGoAccessReport()).toBeNull();
  });

  it("returns null on invalid json", async () => {
    mockReadFile.mockResolvedValue("{not json");
    expect(await getGoAccessReport()).toBeNull();
  });

  it("parses general and panels, dropping invalid items and non-arrays", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        general: { total_requests: 5 },
        requests: {
          data: [
            { hits: { count: 3 }, data: "/p" },
            { hits: "bad", data: "/q" },
          ],
          metadata: { hits: { total: { value: 3 } } },
        },
        browsers: { data: "notarray" },
      }),
    );
    const report = await getGoAccessReport();
    expect(report?.general.total_requests).toBe(5);
    expect(report?.panels.requests).toEqual([
      { hits: { count: 3 }, data: "/p" },
    ]);
    expect(report?.panels.browsers).toEqual([]);
    expect(report?.meta.requests.hits?.total?.value).toBe(3);
    expect(report?.meta.browsers).toEqual({});
  });

  it("falls back to empty general when it is not an object", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ general: "x" }));
    const report = await getGoAccessReport();
    expect(report?.general).toEqual({});
    expect(report?.panels.requests).toEqual([]);
  });
});

describe("filterDaysByRange", () => {
  it("returns all days when range is null", () => {
    const days = [cfDay("a"), cfDay("b")];
    expect(filterDaysByRange(days, null)).toBe(days);
  });

  it("returns the last N days when a range is given", () => {
    const days = [cfDay("a"), cfDay("b"), cfDay("c")];
    expect(filterDaysByRange(days, 2).map((d) => d.dimensions.date)).toEqual([
      "b",
      "c",
    ]);
  });
});

describe("gaPanel", () => {
  it("returns [] for a null report", () => {
    expect(gaPanel(null, "requests", 5)).toEqual([]);
  });

  it("returns [] for an unknown panel", () => {
    const report: GoAccessReport = { general: {}, panels: {}, meta: {} };
    expect(gaPanel(report, "missing", 5)).toEqual([]);
  });

  it("returns the panel items sliced to the limit", () => {
    const report: GoAccessReport = {
      general: {},
      panels: {
        requests: [
          { hits: { count: 5 }, data: "/a" },
          { hits: { count: 3 }, data: "/b" },
        ],
      },
      meta: {},
    };
    expect(gaPanel(report, "requests", 1)).toEqual([
      { hits: { count: 5 }, data: "/a" },
    ]);
  });
});

describe("gaMeta", () => {
  it("returns {} for a null report", () => {
    expect(gaMeta(null, "requests")).toEqual({});
  });

  it("returns {} for an unknown panel", () => {
    const report: GoAccessReport = { general: {}, panels: {}, meta: {} };
    expect(gaMeta(report, "missing")).toEqual({});
  });

  it("returns the panel metadata", () => {
    const report: GoAccessReport = {
      general: {},
      panels: {},
      meta: { requests: { hits: { total: { value: 5 } } } },
    };
    expect(gaMeta(report, "requests").hits?.total?.value).toBe(5);
  });
});

describe("aggregateCloudflare", () => {
  it("sums totals, merges maps and builds the series", () => {
    const days: CloudflareDay[] = [
      cfDay("2026-06-14", {
        requests: 10,
        bytes: 100,
        cachedRequests: 4,
        encryptedRequests: 8,
        pageViews: 2,
        threats: 1,
        countryMap: [
          { clientCountryName: "US", requests: 6, bytes: 60, threats: 1 },
        ],
        responseStatusMap: [{ edgeResponseStatus: 200, requests: 6 }],
        browserMap: [{ uaBrowserFamily: "Chrome", pageViews: 2 }],
        contentTypeMap: [
          { edgeResponseContentTypeName: "html", requests: 6, bytes: 60 },
        ],
        clientHTTPVersionMap: [{ clientHTTPProtocol: "HTTP/2", requests: 6 }],
        ipClassMap: [{ ipType: "noRecord", requests: 6 }],
        threatPathingMap: [{ threatPathingName: "waf", requests: 1 }],
      }),
      {
        dimensions: { date: "2026-06-15" },
        sum: {
          requests: 5,
          bytes: 50,
          cachedRequests: 0,
          cachedBytes: 0,
          encryptedRequests: 0,
          pageViews: 1,
          threats: 0,
          countryMap: [
            { clientCountryName: "US", requests: 2, bytes: 20, threats: 0 },
          ],
          responseStatusMap: [{ edgeResponseStatus: 404, requests: 2 }],
          browserMap: [],
          contentTypeMap: [],
          clientHTTPVersionMap: [],
          ipClassMap: [],
          threatPathingMap: [],
        },
      } as CloudflareDay,
    ];

    const agg = aggregateCloudflare(days);
    expect(agg.totals.requests).toBe(15);
    expect(agg.totals.bytes).toBe(150);
    expect(agg.totals.pageViews).toBe(3);
    expect(agg.totals.threats).toBe(1);
    expect(agg.totals.cachedRequests).toBe(4);
    expect(agg.totals.encryptedRequests).toBe(8);
    expect(agg.totals.uniques).toBe(1);
    expect(agg.countries[0]).toEqual({ label: "US", value: 8 });
    expect(agg.statuses).toHaveLength(2);
    expect(agg.browsers[0]).toEqual({ label: "Chrome", value: 2 });
    expect(agg.contentTypes[0]).toEqual({ label: "html", value: 6 });
    expect(agg.httpVersions[0]).toEqual({ label: "HTTP/2", value: 6 });
    expect(agg.ipClasses[0]).toEqual({ label: "noRecord", value: 6 });
    expect(agg.threatPaths[0]).toEqual({ label: "waf", value: 1 });
    expect(agg.series).toHaveLength(2);
    expect(agg.series[1].uniques).toBe(0);
  });
});
