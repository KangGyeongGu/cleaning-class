import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/app/admin/(protected)/dashboard/Dashboard.client";
import { kstDate, retentionDate } from "@/shared/lib/pure/dashboard";
import { offsetDate } from "@/shared/lib/pure/analytics";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue(navigation),
  usePathname: vi.fn().mockReturnValue("/admin/dashboard"),
}));
const today = kstDate();
const range = {
  start: offsetDate(today, -6),
  end: today,
  today,
  earliest: retentionDate(),
};
const row = {
  date: today,
  visitors: 12,
  phoneCleaning: 2,
  phoneMoving: 1,
  quoteCleaning: 1,
  quoteMoving: 4,
  quoteSubmitCleaning: 7,
  quoteSubmitMoving: 2,
};
const snapshot = { rows: [row], updatedAt: new Date().toISOString() };
const renderDashboard = () =>
  render(<Dashboard initial={snapshot} initialError={null} range={range} />);
const openCalendar = () =>
  fireEvent.click(
    document.querySelector<HTMLButtonElement>(
      '[aria-controls="dashboard-date-picker"]',
    )!,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("관리자 대시보드", () => {
  it("견적 성공·전화 합계와 기존 바로가기를 표시", () => {
    render(
      <Dashboard
        initial={snapshot}
        initialError={null}
        range={range}
        ga4ConsoleUrl="https://analytics.google.com/"
        clarityConsoleUrl="https://clarity.microsoft.com/"
      />,
    );
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "견적 제출" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "견적 접수" }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("날짜별 방문자·전화·견적 추이").textContent,
    ).not.toContain("제출");
    expect(
      within(table).getByRole("row", { name: "청소 7건 1건 2건" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("row", { name: "이사 2건 4건 1건" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("row", { name: "합계 9건 5건 3건" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "트래픽 분석" }).getAttribute("href"),
    ).toBe("/admin/traffic");
    expect(
      screen.getByRole("link", { name: "GA4 콘솔" }).getAttribute("href"),
    ).toBe("https://analytics.google.com/");
    expect(
      screen.getByRole("link", { name: "Clarity 콘솔" }).getAttribute("href"),
    ).toBe("https://clarity.microsoft.com/");
    for (const label of ["콘텐츠 현황", "일별 상세", "견적 제출 클릭"])
      expect(screen.queryByText(label)).toBeNull();
  });
  it("7일·30일 조회와 달력에서 선택한 기간을 URL에 반영", () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "30일" }));
    expect(navigation.push).toHaveBeenCalledWith(
      `/admin/dashboard?start=${offsetDate(today, -29)}&end=${today}`,
      { scroll: false },
    );
    fireEvent.click(screen.getByRole("button", { name: "7일" }));
    expect(navigation.push).toHaveBeenCalledWith(
      `/admin/dashboard?start=${range.start}&end=${today}`,
      { scroll: false },
    );
    expect(screen.queryByLabelText("시작일")).toBeNull();
    openCalendar();
    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: offsetDate(today, -14) },
    });
    fireEvent.click(screen.getByRole("button", { name: "적용" }));
    expect(navigation.push).toHaveBeenLastCalledWith(
      `/admin/dashboard?start=${offsetDate(today, -14)}&end=${today}`,
      { scroll: false },
    );
    expect(screen.queryByLabelText("시작일")).toBeNull();
  });
  it("월 전체 선택과 취소·Escape 닫기를 지원", () => {
    renderDashboard();
    openCalendar();
    fireEvent.click(screen.getByRole("button", { name: "월 전체" }));
    const month = range.start.slice(0, 7);
    expect((screen.getByLabelText("시작일") as HTMLInputElement).value).toBe(
      `${month}-01`,
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(navigation.push).not.toHaveBeenCalled();
    openCalendar();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByLabelText("시작일")).toBeNull();
  });
  it("갱신 성공으로 합계를 바꾸고 실패하면 직전 값을 유지", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...snapshot, rows: [{ ...row, quoteCleaning: 8 }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
    await waitFor(() =>
      expect(
        screen.getByRole("row", { name: "청소 7건 8건 2건" }),
      ).toBeTruthy(),
    );
    expect(fetcher).toHaveBeenCalledWith(
      `/api/admin/dashboard?start=${range.start}&end=${today}`,
      expect.objectContaining({ cache: "no-store" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "이전에 조회한 값",
      ),
    );
    expect(screen.getByRole("row", { name: "청소 7건 8건 2건" })).toBeTruthy();
  });
  it("하나의 차트와 중앙 하단 범례를 렌더링하고 표시 항목 전환", async () => {
    const warning = vi.spyOn(console, "warn");
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".recharts-wrapper")).toBeTruthy(),
    );
    expect(document.querySelectorAll(".recharts-wrapper").length).toBe(1);
    const legend = screen.getByLabelText("차트 표시 항목");
    expect(
      within(legend)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["방문자", "청소 견적", "이사 견적", "청소 전화", "이사 전화"]);
    const button = within(legend).getByRole("button", { name: "방문자" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(warning.mock.calls.flat().join(" ")).not.toContain(
      "should be greater than 0",
    );
  });
  it("같은 기간의 새 서버 응답과 오류를 반영하고 오류 시 직전 합계를 유지", () => {
    const view = renderDashboard();
    view.rerender(
      <Dashboard
        initial={{ ...snapshot, rows: [{ ...row, quoteCleaning: 8 }] }}
        initialError={null}
        range={range}
      />,
    );
    expect(screen.getByRole("row", { name: "청소 7건 8건 2건" })).toBeTruthy();
    view.rerender(
      <Dashboard initial={null} initialError="서버 조회 실패" range={range} />,
    );
    expect(screen.getByRole("alert").textContent).toContain("서버 조회 실패");
    expect(screen.getByRole("row", { name: "청소 7건 8건 2건" })).toBeTruthy();
    view.rerender(
      <Dashboard
        initial={{ ...snapshot, rows: [{ ...row, quoteCleaning: 9 }] }}
        initialError={null}
        range={range}
      />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("row", { name: "청소 7건 9건 2건" })).toBeTruthy();
  });
  it("모바일에서도 차트와 고객 활동 표가 화면 밖으로 밀리지 않음", async () => {
    await act(async () => {
      await page.viewport(390, 844);
    });
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".recharts-wrapper")).toBeTruthy(),
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
    await act(async () => {
      await page.viewport(1280, 1000);
    });
  });
});
