import { describe, expect, it } from "vitest";
import {
  dashboardRange,
  dashboardRowSchema,
  dashboardTotals,
  kstDate,
  retentionDate,
} from "@/shared/lib/pure/dashboard";

describe("대시보드 날짜와 합계", () => {
  it("한국 자정과 월 단위 6개월 말일 보정", () => {
    expect(kstDate(new Date("2026-10-28T15:00:00Z"))).toBe("2026-10-29");
    expect(retentionDate(new Date("2026-08-31T00:00:00Z"))).toBe("2026-02-28");
    expect(retentionDate(new Date("2024-08-31T00:00:00Z"))).toBe("2024-02-29");
    expect(retentionDate(new Date("2026-10-29T00:00:00Z"))).toBe("2026-04-29");
    expect(kstDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(retentionDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("오늘 기본값과 날짜 검증", () => {
    const now = new Date("2026-10-29T00:00:00Z");
    expect(dashboardRange({}, now)).toEqual({
      start: "2026-10-23",
      end: "2026-10-29",
      today: "2026-10-29",
      earliest: "2026-04-29",
    });
    expect(
      dashboardRange({ start: "2026-04-29", end: "2026-10-29" }, now).start,
    ).toBe("2026-04-29");
    for (const start of [
      "bad",
      "2026-02-30",
      "2026-13-01",
      "2026-04-28",
      "2026-10-30",
    ]) {
      expect(() => dashboardRange({ start }, now)).toThrow();
    }
    expect(() =>
      dashboardRange({ start: "2026-10-29", end: "2026-10-28" }, now),
    ).toThrow();
    expect(() => dashboardRange({ end: "2026-10-30" }, now)).toThrow();
    expect(dashboardRange({}, now).start).toBe("2026-10-23");
  });
  it("과거 미측정값과 청소·이사 합산", () => {
    const row = {
      date: "2026-10-29",
      visitors: 2,
      phoneCleaning: 1,
      phoneMoving: 2,
      quoteCleaning: 5,
      quoteMoving: 6,
    };
    expect(dashboardRowSchema.parse(row)).toEqual(row);
    expect(dashboardTotals([row, { ...row, visitors: null }])).toEqual({
      phoneCleaning: 2,
      phoneMoving: 4,
      quoteCleaning: 10,
      quoteMoving: 12,
    });
    expect(dashboardTotals([]).quoteCleaning).toBe(0);
  });
});

describe("기존 DB 읽기 전용 호환", () => {
  it("집계와 원본 중복 없이 합산하고 방문자는 미측정", async () => {
    const { legacyDashboardRows } = await import("@/shared/lib/pure/dashboard");
    const rows = legacyDashboardRows(
      "2026-10-27",
      "2026-10-29",
      [
        {
          date: "2026-10-27",
          event_type: "phone_click",
          dimension: "cleaning",
          count: 4,
        },
        {
          date: "2026-10-28",
          event_type: "quote_form_success",
          dimension: "moving",
          count: 5,
        },
        {
          date: "2026-10-29",
          event_type: "phone_click",
          dimension: "cleaning",
          count: 99,
        },
        {
          date: "2026-10-27",
          event_type: "other",
          dimension: "cleaning",
          count: 99,
        },
        {
          date: "2026-10-26",
          event_type: "phone_click",
          dimension: "cleaning",
          count: 99,
        },
        {
          date: "2026-10-27",
          event_type: "phone_click",
          dimension: "bad",
          count: 99,
        },
      ],
      [
        {
          created_at: "2026-10-28T01:00:00Z",
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "moving" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: { phone_type: "cleaning" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: { phone_type: "moving" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "quote_form_click",
          event_payload: { inquiry_type: "cleaning" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "quote_form_click",
          event_payload: { inquiry_type: "moving" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "quote_form_success",
          event_payload: { inquiry_type: "cleaning" },
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: null,
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: "bad",
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: {},
        },
        {
          created_at: "2026-10-29T01:00:00Z",
          event_type: "phone_click",
          event_payload: { phone_type: 1 },
        },
      ],
    );
    expect(rows.map((row) => row.visitors)).toEqual([null, null, null]);
    expect(rows[0].phoneCleaning).toBe(4);
    expect(rows[1].quoteMoving).toBe(5);
    expect(rows[2]).toMatchObject({
      phoneCleaning: 99,
      phoneMoving: 1,
      quoteCleaning: 1,
    });
    expect(
      legacyDashboardRows(
        "2026-10-29",
        "2026-10-29",
        [],
        [
          {
            created_at: "2026-10-29T01:00:00Z",
            event_type: "phone_click",
            event_payload: { phone_type: "cleaning" },
          },
        ],
      )[0].phoneCleaning,
    ).toBe(1);
    expect(
      legacyDashboardRows(
        "2026-10-29",
        "2026-10-29",
        [
          {
            date: "2026-10-29",
            event_type: "quote_form_click",
            dimension: "cleaning",
            count: 3,
          },
        ],
        [],
      )[0].quoteCleaning,
    ).toBe(0);
  });
});
