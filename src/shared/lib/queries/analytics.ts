import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface AnalyticsData {
  summary: {
    activeUsers: number;
    sessions: number;
    phoneClicks: number;
    formSubmissions: number;
  };
  dailyVisitors: Array<{ date: string; activeUsers: number; sessions: number }>;
  deviceBreakdown: Array<{ device: string; users: number }>;
  deviceDetail: Array<{
    device: string;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
  }>;
  browserBreakdown: Array<{ browser: string; users: number }>;
  trafficSources: Array<{ channel: string; sessions: number }>;
  topPages: Array<{ path: string; views: number }>;
  conversionEvents: Array<{ eventName: string; count: number }>;
  regionBreakdown: Array<{ region: string; city: string; users: number }>;
  lastUpdated: string;
}

function getGA4Client(): BetaAnalyticsDataClient | null {
  const email = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY;
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!email || !privateKey || !propertyId) {
    return null;
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,

      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });
}

function formatDate(dateString: string): string {
  if (dateString.length === 8) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }
  return dateString;
}

function toNumber(value: string | null | undefined): number {
  const num = parseInt(value ?? "0", 10);
  return Number.isNaN(num) ? 0 : num;
}

function toFloat(value: string | null | undefined): number {
  const num = parseFloat(value ?? "0");
  return Number.isNaN(num) ? 0 : num;
}

function getGA4Config(): {
  client: BetaAnalyticsDataClient;
  property: string;
  dateRange: { startDate: string; endDate: string };
} | null {
  const client = getGA4Client();
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!client || !propertyId) return null;
  return {
    client,
    property: `properties/${propertyId}`,
    dateRange: { startDate: "30daysAgo", endDate: "today" },
  };
}

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const config = getGA4Config();
  if (!config) {
    console.warn(
      "[getAnalyticsData] GA4 클라이언트 생성 실패 — 환경변수 확인 필요",
    );
    return null;
  }

  const { client, property, dateRange } = config;

  try {
    const [
      summaryResult,
      dailyResult,
      deviceResult,
      deviceDetailResult,
      browserResult,
      sourceResult,
      pagesResult,
      conversionResult,
      regionResult,
    ] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [dateRange],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [
          { name: "sessions" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "browser" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: [
                "generate_lead",
                "review_card_click",
                "sns_click",
                "faq_open",
                "phone_click",
              ],
            },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      }),

      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "region" }, { name: "city" }],
        metrics: [{ name: "activeUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "countryId",
            stringFilter: { value: "KR" },
          },
        },
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 15,
      }),
    ]);

    const summaryRow = summaryResult[0]?.rows?.[0];
    const activeUsers = toNumber(summaryRow?.metricValues?.[0]?.value);
    const sessions = toNumber(summaryRow?.metricValues?.[1]?.value);

    const conversionRows = conversionResult[0]?.rows ?? [];
    const conversionEvents = conversionRows.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "",
      count: toNumber(row.metricValues?.[0]?.value),
    }));

    const phoneClicks =
      conversionEvents.find((e) => e.eventName === "phone_click")?.count ?? 0;
    const formSubmissions =
      conversionEvents.find((e) => e.eventName === "generate_lead")?.count ?? 0;

    const dailyVisitors = (dailyResult[0]?.rows ?? []).map((row) => ({
      date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
      activeUsers: toNumber(row.metricValues?.[0]?.value),
      sessions: toNumber(row.metricValues?.[1]?.value),
    }));

    const deviceBreakdown = (deviceResult[0]?.rows ?? []).map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? "",
      users: toNumber(row.metricValues?.[0]?.value),
    }));

    const deviceDetail = (deviceDetailResult[0]?.rows ?? []).map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? "",
      sessions: toNumber(row.metricValues?.[0]?.value),
      bounceRate: toFloat(row.metricValues?.[1]?.value),
      avgSessionDuration: toFloat(row.metricValues?.[2]?.value),
    }));

    const browserBreakdown = (browserResult[0]?.rows ?? []).map((row) => ({
      browser: row.dimensionValues?.[0]?.value ?? "",
      users: toNumber(row.metricValues?.[0]?.value),
    }));

    const trafficSources = (sourceResult[0]?.rows ?? []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "",
      sessions: toNumber(row.metricValues?.[0]?.value),
    }));

    const topPages = (pagesResult[0]?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: toNumber(row.metricValues?.[0]?.value),
    }));

    const regionBreakdown = (regionResult[0]?.rows ?? []).map((row) => ({
      region: row.dimensionValues?.[0]?.value ?? "",
      city: row.dimensionValues?.[1]?.value ?? "",
      users: toNumber(row.metricValues?.[0]?.value),
    }));

    return {
      summary: { activeUsers, sessions, phoneClicks, formSubmissions },
      dailyVisitors,
      deviceDetail,
      browserBreakdown,
      deviceBreakdown,
      trafficSources,
      topPages,
      conversionEvents,
      regionBreakdown,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[getAnalyticsData] GA4 Data API 호출 실패:", errMsg);
    if (error instanceof Error && error.stack) {
      console.error("[getAnalyticsData] Stack:", error.stack);
    }
    return null;
  }
}

export async function getAnalyticsSummary(): Promise<Pick<
  AnalyticsData,
  "summary" | "conversionEvents" | "lastUpdated"
> | null> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [summaryResult, conversionResult] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [dateRange],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: [
                "generate_lead",
                "review_card_click",
                "sns_click",
                "faq_open",
                "phone_click",
              ],
            },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      }),
    ]);

    const summaryRow = summaryResult[0]?.rows?.[0];
    const conversionEvents = (conversionResult[0]?.rows ?? []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "",
      count: toNumber(row.metricValues?.[0]?.value),
    }));

    return {
      summary: {
        activeUsers: toNumber(summaryRow?.metricValues?.[0]?.value),
        sessions: toNumber(summaryRow?.metricValues?.[1]?.value),
        phoneClicks:
          conversionEvents.find((e) => e.eventName === "phone_click")?.count ??
          0,
        formSubmissions:
          conversionEvents.find((e) => e.eventName === "generate_lead")
            ?.count ?? 0,
      },
      conversionEvents,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      "[getAnalyticsSummary]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function getAnalyticsDailyVisitors(): Promise<
  AnalyticsData["dailyVisitors"] | null
> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [result] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    });
    return (result?.rows ?? []).map((row) => ({
      date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
      activeUsers: toNumber(row.metricValues?.[0]?.value),
      sessions: toNumber(row.metricValues?.[1]?.value),
    }));
  } catch (error) {
    console.error(
      "[getAnalyticsDailyVisitors]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function getAnalyticsTrafficSources(): Promise<
  AnalyticsData["trafficSources"] | null
> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [result] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });
    return (result?.rows ?? []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "",
      sessions: toNumber(row.metricValues?.[0]?.value),
    }));
  } catch (error) {
    console.error(
      "[getAnalyticsTrafficSources]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function getAnalyticsDevice(): Promise<Pick<
  AnalyticsData,
  "deviceBreakdown" | "deviceDetail" | "browserBreakdown"
> | null> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [deviceResult, detailResult, browserResult] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [
          { name: "sessions" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "browser" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
    ]);

    return {
      deviceBreakdown: (deviceResult[0]?.rows ?? []).map((row) => ({
        device: row.dimensionValues?.[0]?.value ?? "",
        users: toNumber(row.metricValues?.[0]?.value),
      })),
      deviceDetail: (detailResult[0]?.rows ?? []).map((row) => ({
        device: row.dimensionValues?.[0]?.value ?? "",
        sessions: toNumber(row.metricValues?.[0]?.value),
        bounceRate: parseFloat(row.metricValues?.[1]?.value ?? "0"),
        avgSessionDuration: parseFloat(row.metricValues?.[2]?.value ?? "0"),
      })),
      browserBreakdown: (browserResult[0]?.rows ?? []).map((row) => ({
        browser: row.dimensionValues?.[0]?.value ?? "",
        users: toNumber(row.metricValues?.[0]?.value),
      })),
    };
  } catch (error) {
    console.error(
      "[getAnalyticsDevice]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function getAnalyticsTopPages(): Promise<
  AnalyticsData["topPages"] | null
> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [result] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    });
    return (result?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: toNumber(row.metricValues?.[0]?.value),
    }));
  } catch (error) {
    console.error(
      "[getAnalyticsTopPages]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function getAnalyticsRegion(): Promise<
  AnalyticsData["regionBreakdown"] | null
> {
  const config = getGA4Config();
  if (!config) return null;
  const { client, property, dateRange } = config;

  try {
    const [result] = await client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: "region" }, { name: "city" }],
      metrics: [{ name: "activeUsers" }],
      dimensionFilter: {
        filter: { fieldName: "countryId", stringFilter: { value: "KR" } },
      },
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 15,
    });
    return (result?.rows ?? []).map((row) => ({
      region: row.dimensionValues?.[0]?.value ?? "",
      city: row.dimensionValues?.[1]?.value ?? "",
      users: toNumber(row.metricValues?.[0]?.value),
    }));
  } catch (error) {
    console.error(
      "[getAnalyticsRegion]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
