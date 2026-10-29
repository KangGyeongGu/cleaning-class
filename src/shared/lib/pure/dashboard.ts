import { z } from "zod";
import { KST_OFFSET_MS } from "@/shared/lib/pure/constants";
import {
  ANALYTICS_RETENTION_MONTHS,
  DASHBOARD_DEFAULT_DAYS,
  offsetDate,
} from "@/shared/lib/pure/analytics";

export function kstDate(now = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function retentionDate(now = new Date()): string {
  const [year, month, day] = kstDate(now).split("-").map(Number);
  const target = new Date(
    Date.UTC(year, month - 1 - ANALYTICS_RETENTION_MONTHS, 1),
  );
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "존재하지 않는 날짜입니다");

export function dashboardRange(
  input: { start?: string; end?: string },
  now = new Date(),
) {
  const today = kstDate(now);
  const earliest = retentionDate(now);
  const range = z.object({ start: dateSchema, end: dateSchema }).parse({
    start: input.start ?? offsetDate(today, 1 - DASHBOARD_DEFAULT_DAYS),
    end: input.end ?? today,
  });
  if (range.start < earliest || range.end > today || range.start > range.end)
    throw new Error("최근 6개월 이내의 올바른 조회 기간을 선택해주세요.");
  return { ...range, today, earliest };
}

const countSchema = z.number().int().nonnegative();
export const dashboardRowSchema = z.object({
  date: dateSchema,
  visitors: countSchema.nullable(),
  phoneCleaning: countSchema,
  phoneMoving: countSchema,
  quoteCleaning: countSchema,
  quoteMoving: countSchema,
});
export const dashboardSnapshotSchema = z.object({
  rows: dashboardRowSchema.array(),
  updatedAt: z.string().datetime(),
});
export type DashboardRow = z.infer<typeof dashboardRowSchema>;
export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;

export function dashboardTotals(rows: DashboardRow[]) {
  return rows.reduce(
    (total, row) => ({
      phoneCleaning: total.phoneCleaning + row.phoneCleaning,
      phoneMoving: total.phoneMoving + row.phoneMoving,
      quoteCleaning: total.quoteCleaning + row.quoteCleaning,
      quoteMoving: total.quoteMoving + row.quoteMoving,
    }),
    { phoneCleaning: 0, phoneMoving: 0, quoteCleaning: 0, quoteMoving: 0 },
  );
}

export interface DailyActivity {
  date: string;
  event_type: string;
  dimension: string;
  count: number;
}
export interface RawActivity {
  created_at: string;
  event_type: string;
  event_payload: unknown;
}

export function legacyDashboardRows(
  start: string,
  end: string,
  daily: DailyActivity[],
  events: RawActivity[],
): DashboardRow[] {
  const counts = new Map<string, DashboardRow>();
  for (let day = start; day <= end; day = offsetDate(day, 1)) {
    counts.set(day, {
      date: day,
      visitors: null,
      phoneCleaning: 0,
      phoneMoving: 0,
      quoteCleaning: 0,
      quoteMoving: 0,
    });
  }
  const rawCounts = new Map<string, number>();
  for (const event of events) {
    const payload = event.event_payload;
    if (typeof payload !== "object" || payload === null) continue;
    const key =
      event.event_type === "phone_click" ? "phone_type" : "inquiry_type";
    const dimension: unknown =
      key in payload ? (payload as Record<string, unknown>)[key] : null;
    if (dimension !== "cleaning" && dimension !== "moving") continue;
    const group = `${kstDate(new Date(event.created_at))}:${event.event_type}:${dimension}`;
    rawCounts.set(group, (rawCounts.get(group) ?? 0) + 1);
  }
  const merged = new Map(rawCounts);
  for (const row of daily) {
    const key = `${row.date}:${row.event_type}:${row.dimension}`;
    merged.set(key, Math.max(merged.get(key) ?? 0, row.count));
  }
  for (const [key, count] of merged) {
    const [date, event, segment] = key.split(":");
    const row = counts.get(date);
    if (!row || (segment !== "cleaning" && segment !== "moving")) continue;
    if (event === "phone_click")
      row[segment === "cleaning" ? "phoneCleaning" : "phoneMoving"] = count;
    if (event === "quote_form_success")
      row[segment === "cleaning" ? "quoteCleaning" : "quoteMoving"] = count;
  }
  return [...counts.values()];
}
