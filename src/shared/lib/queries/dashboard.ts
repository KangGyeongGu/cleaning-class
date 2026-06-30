import { createClient } from "@/shared/lib/supabase/server";
import { KST_OFFSET_MS } from "@/shared/lib/pure/constants";

export interface DailyTrendRow {
  date: string;
  visitors: number;
  quoteCleaning: number;
  quoteMoving: number;
  phoneCleaning: number;
  phoneMoving: number;
}

export interface TrafficSourceRow {
  source: string;
  count: number;
}

export interface CustomerActionTotals {
  quoteCleaning: number;
  quoteMoving: number;
  phoneCleaning: number;
  phoneMoving: number;
}

function nDaysAgoKst(n: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  kst.setUTCDate(kst.getUTCDate() - n);
  return kst.toISOString().slice(0, 10);
}

type DailyRow = {
  date: string;
  event_type: string;
  dimension: string | null;
  count: number;
};

function asSegment(dimension: string | null): "cleaning" | "moving" | null {
  if (dimension === "cleaning" || dimension === "moving") return dimension;
  return null;
}

export async function getDailyTrend7d(): Promise<DailyTrendRow[]> {
  const supabase = await createClient();
  const startDate = nDaysAgoKst(6);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("date, event_type, dimension, count")
    .gte("date", startDate)
    .in("event_type", ["page_landing", "quote_form_success", "phone_click"]);

  if (error) {
    console.error("[getDailyTrend7d]", error);
    return [];
  }

  const byDate = new Map<string, DailyTrendRow>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = nDaysAgoKst(i);
    byDate.set(d, {
      date: d,
      visitors: 0,
      quoteCleaning: 0,
      quoteMoving: 0,
      phoneCleaning: 0,
      phoneMoving: 0,
    });
  }

  for (const row of (data as DailyRow[] | null) ?? []) {
    const target = byDate.get(row.date);
    if (!target) continue;
    if (row.event_type === "page_landing") {
      target.visitors += row.count;
    } else if (row.event_type === "quote_form_success") {
      const seg = asSegment(row.dimension);
      if (seg === "cleaning") target.quoteCleaning += row.count;
      else if (seg === "moving") target.quoteMoving += row.count;
    } else if (row.event_type === "phone_click") {
      const seg = asSegment(row.dimension);
      if (seg === "cleaning") target.phoneCleaning += row.count;
      else if (seg === "moving") target.phoneMoving += row.count;
    }
  }

  return Array.from(byDate.values());
}

export async function getTrafficSources30d(): Promise<TrafficSourceRow[]> {
  const supabase = await createClient();
  const startDate = nDaysAgoKst(29);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("dimension, count")
    .eq("event_type", "page_landing")
    .gte("date", startDate);

  if (error) {
    console.error("[getTrafficSources30d]", error);
    return [];
  }

  const totals = (
    (data as Pick<DailyRow, "dimension" | "count">[] | null) ?? []
  ).reduce<Record<string, number>>((acc, row) => {
    const key = row.dimension || "direct";
    acc[key] = (acc[key] ?? 0) + row.count;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getCustomerActions30d(): Promise<CustomerActionTotals> {
  const supabase = await createClient();
  const startDate = nDaysAgoKst(29);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("event_type, dimension, count")
    .in("event_type", ["quote_form_success", "phone_click"])
    .gte("date", startDate);

  const empty: CustomerActionTotals = {
    quoteCleaning: 0,
    quoteMoving: 0,
    phoneCleaning: 0,
    phoneMoving: 0,
  };

  if (error) {
    console.error("[getCustomerActions30d]", error);
    return empty;
  }

  const result = empty;
  for (const row of (data as
    | Pick<DailyRow, "event_type" | "dimension" | "count">[]
    | null) ?? []) {
    if (row.event_type === "quote_form_success") {
      const seg = asSegment(row.dimension);
      if (seg === "cleaning") result.quoteCleaning += row.count;
      else if (seg === "moving") result.quoteMoving += row.count;
    } else if (row.event_type === "phone_click") {
      const seg = asSegment(row.dimension);
      if (seg === "cleaning") result.phoneCleaning += row.count;
      else if (seg === "moving") result.phoneMoving += row.count;
    }
  }

  return result;
}
