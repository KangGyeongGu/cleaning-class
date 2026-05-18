"use server";

import {
  getAnalyticsData,
  getAnalyticsSummary,
  getAnalyticsDailyVisitors,
  getAnalyticsTrafficSources,
  getAnalyticsDevice,
  getAnalyticsTopPages,
  getAnalyticsRegion,
} from "@/shared/lib/queries/analytics";
import type { AnalyticsData } from "@/shared/lib/queries/analytics";
import { getUser } from "@/shared/lib/supabase/auth";

async function safeAction<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    await getUser();
    return await fn();
  } catch (error) {
    console.error(
      "[analytics action]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function refreshAllAnalytics(): Promise<AnalyticsData | null> {
  return safeAction(getAnalyticsData);
}

export async function refreshSummary(): Promise<Pick<
  AnalyticsData,
  "summary" | "conversionEvents" | "lastUpdated"
> | null> {
  return safeAction(getAnalyticsSummary);
}

export async function refreshDailyVisitors(): Promise<
  AnalyticsData["dailyVisitors"] | null
> {
  return safeAction(getAnalyticsDailyVisitors);
}

export async function refreshTrafficSources(): Promise<
  AnalyticsData["trafficSources"] | null
> {
  return safeAction(getAnalyticsTrafficSources);
}

export async function refreshDevice(): Promise<Pick<
  AnalyticsData,
  "deviceBreakdown" | "deviceDetail" | "browserBreakdown"
> | null> {
  return safeAction(getAnalyticsDevice);
}

export async function refreshTopPages(): Promise<
  AnalyticsData["topPages"] | null
> {
  return safeAction(getAnalyticsTopPages);
}

export async function refreshRegion(): Promise<
  AnalyticsData["regionBreakdown"] | null
> {
  return safeAction(getAnalyticsRegion);
}
