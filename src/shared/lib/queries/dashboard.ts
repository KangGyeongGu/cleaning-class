import { createClient } from "@/shared/lib/supabase/server";

export interface SegmentedCount {
  cleaning: number;
  moving: number;
}

export interface TodayStats {
  visitors: number;
  quoteSubmissions: SegmentedCount;
  phoneClicks: SegmentedCount;
}

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

function kstDateFromIso(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

type EventRow = {
  event_type: string;
  event_payload: Record<string, unknown> | null;
  created_at: string;
};

function extractSegment(
  payload: Record<string, unknown> | null,
  key: string,
): "cleaning" | "moving" | null {
  const value = payload?.[key];
  if (value === "cleaning" || value === "moving") return value;
  return null;
}

export async function getTodayStats(): Promise<TodayStats> {
  const supabase = await createClient();
  const startOfTodayKst = `${todayKstDate()}T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, event_payload")
    .gte("created_at", startOfTodayKst);

  const empty: TodayStats = {
    visitors: 0,
    quoteSubmissions: { cleaning: 0, moving: 0 },
    phoneClicks: { cleaning: 0, moving: 0 },
  };

  if (error) {
    console.error("[getTodayStats]", error);
    return empty;
  }

  const result = empty;
  for (const row of (data as
    | Pick<EventRow, "event_type" | "event_payload">[]
    | null) ?? []) {
    if (row.event_type === "page_landing") {
      result.visitors += 1;
    } else if (row.event_type === "quote_form_success") {
      const seg = extractSegment(row.event_payload, "inquiry_type");
      if (seg) result.quoteSubmissions[seg] += 1;
    } else if (row.event_type === "phone_click") {
      const seg = extractSegment(row.event_payload, "phone_type");
      if (seg) result.phoneClicks[seg] += 1;
    }
  }

  return result;
}

export async function getDailyTrend7d(): Promise<DailyTrendRow[]> {
  const supabase = await createClient();
  const startDate = nDaysAgoKst(6);
  const startIso = `${startDate}T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, event_payload, created_at")
    .gte("created_at", startIso)
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

  for (const row of (data as EventRow[] | null) ?? []) {
    const target = byDate.get(kstDateFromIso(row.created_at));
    if (!target) continue;
    if (row.event_type === "page_landing") {
      target.visitors += 1;
    } else if (row.event_type === "quote_form_success") {
      const seg = extractSegment(row.event_payload, "inquiry_type");
      if (seg === "cleaning") target.quoteCleaning += 1;
      else if (seg === "moving") target.quoteMoving += 1;
    } else if (row.event_type === "phone_click") {
      const seg = extractSegment(row.event_payload, "phone_type");
      if (seg === "cleaning") target.phoneCleaning += 1;
      else if (seg === "moving") target.phoneMoving += 1;
    }
  }

  return Array.from(byDate.values());
}

export async function getTrafficSources30d(): Promise<TrafficSourceRow[]> {
  const supabase = await createClient();
  const startIso = `${nDaysAgoKst(29)}T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_payload")
    .eq("event_type", "page_landing")
    .gte("created_at", startIso);

  if (error) {
    console.error("[getTrafficSources30d]", error);
    return [];
  }

  const totals = (
    (data as Pick<EventRow, "event_payload">[] | null) ?? []
  ).reduce<Record<string, number>>((acc, row) => {
    const source =
      typeof row.event_payload?.source === "string"
        ? row.event_payload.source
        : "";
    const key = source || "direct";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getCustomerActions30d(): Promise<CustomerActionTotals> {
  const supabase = await createClient();
  const startIso = `${nDaysAgoKst(29)}T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, event_payload")
    .in("event_type", ["quote_form_success", "phone_click"])
    .gte("created_at", startIso);

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
    | Pick<EventRow, "event_type" | "event_payload">[]
    | null) ?? []) {
    if (row.event_type === "quote_form_success") {
      const seg = extractSegment(row.event_payload, "inquiry_type");
      if (seg === "cleaning") result.quoteCleaning += 1;
      else if (seg === "moving") result.quoteMoving += 1;
    } else if (row.event_type === "phone_click") {
      const seg = extractSegment(row.event_payload, "phone_type");
      if (seg === "cleaning") result.phoneCleaning += 1;
      else if (seg === "moving") result.phoneMoving += 1;
    }
  }

  return result;
}
