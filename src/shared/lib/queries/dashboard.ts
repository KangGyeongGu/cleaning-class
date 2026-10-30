import "server-only";
import { createClient } from "@/shared/lib/supabase/server";
import { ANALYTICS_PAGE_SIZE, offsetDate } from "@/shared/lib/pure/analytics";
import {
  dashboardRange,
  dashboardRowSchema,
  legacyDashboardRows,
} from "@/shared/lib/pure/dashboard";
import type {
  DashboardSnapshot,
  DailyActivity,
  RawActivity,
} from "@/shared/lib/pure/dashboard";

const ACTIVITY_TYPES = [
  "phone_click",
  "quote_form_success",
  "quote_form_click",
];

async function getExistingActivities(
  start: string,
  end: string,
): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const daily: DailyActivity[] = [];
  const events: RawActivity[] = [];
  for (let offset = 0; ; offset += ANALYTICS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("analytics_daily")
      .select("date,event_type,dimension,count")
      .gte("date", start)
      .lte("date", end)
      .in("event_type", ACTIVITY_TYPES)
      .order("date")
      .order("event_type")
      .order("dimension")
      .range(offset, offset + ANALYTICS_PAGE_SIZE - 1);
    if (error) throw new Error(`일별 통계 조회 실패: ${error.code}`);
    const page = data ?? [];
    daily.push(...page);
    if (page.length < ANALYTICS_PAGE_SIZE) break;
  }
  for (let offset = 0; ; offset += ANALYTICS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("created_at,event_type,event_payload,id")
      .gte("created_at", `${start}T00:00:00+09:00`)
      .lt("created_at", `${offsetDate(end, 1)}T00:00:00+09:00`)
      .in("event_type", ACTIVITY_TYPES)
      .order("created_at")
      .order("id")
      .range(offset, offset + ANALYTICS_PAGE_SIZE - 1);
    if (error) throw new Error(`활동 통계 조회 실패: ${error.code}`);
    const page = data ?? [];
    events.push(...page);
    if (page.length < ANALYTICS_PAGE_SIZE) break;
  }
  return {
    rows: legacyDashboardRows(start, end, daily, events),
    updatedAt: new Date().toISOString(),
  };
}

export async function getDashboardSnapshot(
  start: string,
  end: string,
): Promise<DashboardSnapshot> {
  dashboardRange({ start, end });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_snapshot", {
    p_start: start,
    p_end: end,
  });
  if (error?.code === "PGRST202") return getExistingActivities(start, end);
  if (error) throw new Error(`대시보드 조회 실패: ${error.code}`);
  return {
    rows: dashboardRowSchema.array().parse(data),
    updatedAt: new Date().toISOString(),
  };
}
