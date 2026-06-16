import { describe, it, expect } from "vitest";

import {
  cloudflareDaySchema,
  gaPanelItemSchema,
  gaGeneralSchema,
  gaPanelMetaSchema,
} from "@/shared/lib/schema/traffic";

describe("cloudflareDaySchema", () => {
  it("parses a full day with all maps", () => {
    const parsed = cloudflareDaySchema.parse({
      dimensions: { date: "2026-06-15" },
      uniq: { uniques: 5 },
      sum: {
        requests: 10,
        bytes: 100,
        cachedRequests: 1,
        cachedBytes: 2,
        encryptedRequests: 3,
        pageViews: 4,
        threats: 5,
        countryMap: [
          { clientCountryName: "US", requests: 6, bytes: 60, threats: 1 },
        ],
        responseStatusMap: [{ edgeResponseStatus: 200, requests: 6 }],
        browserMap: [{ uaBrowserFamily: "Chrome", pageViews: 4 }],
        contentTypeMap: [
          { edgeResponseContentTypeName: "html", requests: 6, bytes: 60 },
        ],
        clientHTTPVersionMap: [{ clientHTTPProtocol: "HTTP/2", requests: 6 }],
        ipClassMap: [{ ipType: "noRecord", requests: 6 }],
        threatPathingMap: [{ threatPathingName: "waf", requests: 1 }],
      },
    });
    expect(parsed.uniq?.uniques).toBe(5);
    expect(parsed.sum.countryMap[0].threats).toBe(1);
    expect(parsed.sum.clientHTTPVersionMap[0].clientHTTPProtocol).toBe(
      "HTTP/2",
    );
    expect(parsed.sum.ipClassMap[0].ipType).toBe("noRecord");
  });

  it("applies defaults when maps are omitted", () => {
    const parsed = cloudflareDaySchema.parse({
      dimensions: { date: "2026-06-15" },
      sum: {},
    });
    expect(parsed.sum.requests).toBe(0);
    expect(parsed.sum.countryMap).toEqual([]);
    expect(parsed.uniq).toBeUndefined();
  });

  it("rejects when dimensions are missing", () => {
    expect(cloudflareDaySchema.safeParse({ sum: {} }).success).toBe(false);
  });
});

describe("gaPanelItemSchema", () => {
  it("parses count/percent metrics with method, protocol and string data", () => {
    const parsed = gaPanelItemSchema.parse({
      hits: { count: 30, percent: "4.35" },
      visitors: { count: 24, percent: "12.70" },
      bytes: { count: 3659086, percent: "43.24" },
      method: "GET",
      protocol: "HTTP/2",
      data: "/price",
    });
    expect(parsed.hits?.count).toBe(30);
    expect(parsed.hits?.percent).toBe("4.35");
    expect(parsed.method).toBe("GET");
    expect(parsed.data).toBe("/price");
  });

  it("accepts counts without a percent", () => {
    expect(gaPanelItemSchema.parse({ hits: { count: 5 } }).hits?.count).toBe(5);
  });

  it("coerces numeric data to string", () => {
    expect(gaPanelItemSchema.parse({ data: 20260616 }).data).toBe("20260616");
  });

  it("accepts an empty item", () => {
    expect(gaPanelItemSchema.parse({})).toEqual({});
  });

  it("rejects an invalid metric type", () => {
    expect(gaPanelItemSchema.safeParse({ hits: "bad" }).success).toBe(false);
  });
});

describe("gaGeneralSchema", () => {
  it("parses partial fields", () => {
    expect(gaGeneralSchema.parse({ total_requests: 5 }).total_requests).toBe(5);
  });

  it("parses an empty object", () => {
    expect(gaGeneralSchema.parse({})).toEqual({});
  });
});

describe("gaPanelMetaSchema", () => {
  it("parses min/max/avg/total metadata for each metric", () => {
    const parsed = gaPanelMetaSchema.parse({
      hits: {
        total: { value: 100 },
        avg: { value: 2, percent: "0.03" },
        max: { value: 50 },
        min: { value: 1 },
      },
      visitors: { total: { value: 50 } },
      bytes: { total: { value: 1000, percent: "100.00" } },
    });
    expect(parsed.hits?.total?.value).toBe(100);
    expect(parsed.hits?.avg?.percent).toBe("0.03");
    expect(parsed.bytes?.total?.value).toBe(1000);
  });

  it("parses empty metadata", () => {
    expect(gaPanelMetaSchema.parse({})).toEqual({});
  });
});
