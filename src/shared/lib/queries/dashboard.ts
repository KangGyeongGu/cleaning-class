import { createClient } from "@/shared/lib/supabase/server";
import type { EventType } from "@/shared/lib/schema/analytics";

export interface TodayStats {
  landings: number;
  quoteClicks: number;
  quoteSuccess: number;
  phoneClicks: number;
}

export interface QuoteFunnelRow {
  date: string;
  landings: number;
  clicks: number;
  success: number;
}

export interface TrafficSourceRow {
  source: string;
  count: number;
}

export interface EventCountRow {
  event_type: EventType;
  count: number;
}

function todayKstDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function nDaysAgoKst(n: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - n);
  return kst.toISOString().slice(0, 10);
}

export async function getTodayStats(): Promise<TodayStats> {
  const supabase = await createClient();
  const startOfTodayKst = `${todayKstDate()}T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type")
    .gte("created_at", startOfTodayKst);

  if (error) {
    console.error("[getTodayStats]", error);
    return { landings: 0, quoteClicks: 0, quoteSuccess: 0, phoneClicks: 0 };
  }

  const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.event_type] = (acc[row.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    landings: counts.page_landing ?? 0,
    quoteClicks: counts.quote_form_click ?? 0,
    quoteSuccess: counts.quote_form_success ?? 0,
    phoneClicks: counts.phone_click ?? 0,
  };
}

export async function getQuoteFunnel7d(): Promise<QuoteFunnelRow[]> {
  const supabase = await createClient();
  const start = nDaysAgoKst(6);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("date, event_type, count")
    .gte("date", start)
    .in("event_type", [
      "page_landing",
      "quote_form_click",
      "quote_form_success",
    ]);

  if (error) {
    console.error("[getQuoteFunnel7d]", error);
    return [];
  }

  const byDate = new Map<string, QuoteFunnelRow>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = nDaysAgoKst(i);
    byDate.set(d, { date: d, landings: 0, clicks: 0, success: 0 });
  }

  for (const row of data ?? []) {
    const target = byDate.get(row.date);
    if (!target) continue;
    if (row.event_type === "page_landing") target.landings += row.count;
    else if (row.event_type === "quote_form_click") target.clicks += row.count;
    else if (row.event_type === "quote_form_success")
      target.success += row.count;
  }

  return Array.from(byDate.values());
}

export async function getTrafficSources30d(): Promise<TrafficSourceRow[]> {
  const supabase = await createClient();
  const start = nDaysAgoKst(29);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("dimension, count")
    .eq("event_type", "page_landing")
    .gte("date", start);

  if (error) {
    console.error("[getTrafficSources30d]", error);
    return [];
  }

  const totals = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.dimension || "direct";
    acc[key] = (acc[key] ?? 0) + row.count;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getEventCounts30d(): Promise<EventCountRow[]> {
  const supabase = await createClient();
  const start = nDaysAgoKst(29);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("event_type, count")
    .gte("date", start);

  if (error) {
    console.error("[getEventCounts30d]", error);
    return [];
  }

  const totals = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.event_type] = (acc[row.event_type] ?? 0) + row.count;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([event_type, count]) => ({
      event_type: event_type as EventType,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
