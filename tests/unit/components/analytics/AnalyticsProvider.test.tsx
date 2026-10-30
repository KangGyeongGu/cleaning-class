import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider.client";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
const sendGa = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => navigation.pathname),
}));
vi.mock("@next/third-parties/google", () => ({ sendGAEvent: sendGa }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T01:00:00Z"));
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST");
  navigation.pathname = "/";
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { hostname: "www.cleaningclass.co.kr", pathname: "/" },
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  Object.defineProperty(document, "referrer", {
    configurable: true,
    value: "https://www.google.com/search?q=cleaning",
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("방문 수집과 GA4 유입 분리", () => {
  it("방문 API 재시도와 내부 이동이 GA4 유입을 반복 전송하지 않음", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
    const view = render(<AnalyticsProvider />);
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    navigation.pathname = "/services";
    view.rerender(<AnalyticsProvider />);
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sendGa).toHaveBeenCalledTimes(1);
    expect(sendGa).toHaveBeenCalledWith(
      "event",
      "page_landing",
      expect.objectContaining({ landing_path: "/", source: "google" }),
    );
  });
  it("직접 유입도 방문자를 수집하되 기존 GA4 외부 유입 조건을 유지", async () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "",
    });
    render(<AnalyticsProvider />);
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sendGa).not.toHaveBeenCalled();
  });
  it("성공한 당일 요청은 반복하지 않고 다음 한국 날짜에 다시 수집", async () => {
    render(<AnalyticsProvider />);
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-10-29T15:00:00Z"));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sendGa).toHaveBeenCalledTimes(1);
  });
  it("성공한 방문 기록은 공개 페이지를 이동해도 당일 다시 전송하지 않음", async () => {
    const view = render(<AnalyticsProvider />);
    await act(async () => {});
    navigation.pathname = "/services";
    view.rerender(<AnalyticsProvider />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-10-29T15:00:00Z"));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string).path,
    ).toBe("/services");
  });
  it("전송 중 페이지를 이동해도 중복 요청 없이 성공 결과를 유지", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = render(<AnalyticsProvider />);
    navigation.pathname = "/services";
    view.rerender(<AnalyticsProvider />);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish(new Response(null, { status: 204 }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("이동 전 진행 중이던 요청이 실패하면 새 페이지에서 재시도", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = render(<AnalyticsProvider />);
    navigation.pathname = "/services";
    view.rerender(<AnalyticsProvider />);
    await act(async () => {
      finish(new Response(null, { status: 503 }));
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string).path,
    ).toBe("/services");
  });
  it("숨긴 탭은 방문 수집을 기다렸다가 표시되면 기록", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    render(<AnalyticsProvider />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetch).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("관리자 페이지를 제외하고 공개 페이지 전환 후 수집", async () => {
    navigation.pathname = "/admin/dashboard";
    const view = render(<AnalyticsProvider />);
    expect(fetch).not.toHaveBeenCalled();
    expect(sendGa).not.toHaveBeenCalled();
    navigation.pathname = "/";
    view.rerender(<AnalyticsProvider />);
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sendGa).toHaveBeenCalledTimes(1);
  });
  it("StrictMode의 effect 재실행에서도 GA4는 한 번만 전송", async () => {
    render(
      <StrictMode>
        <AnalyticsProvider />
      </StrictMode>,
    );
    await act(async () => {});
    expect(sendGa).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
