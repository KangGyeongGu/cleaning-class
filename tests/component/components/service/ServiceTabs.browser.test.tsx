import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceTabs } from "@/components/service/ServiceTabs.client";
import { ServiceGrid } from "@/components/service/ServiceGrid.client";
import { BLUR_PLACEHOLDER } from "@/shared/lib/pure/constants";

const service = {
  id: "cleaning",
  title: "청소 카드",
  description: "청소 설명",
  imageUrl: BLUR_PLACEHOLDER,
  afterImageUrl: BLUR_PLACEHOLDER,
};

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await page.viewport(1280, 900);
});

describe("서비스 전환 동작", () => {
  it("선택한 탭만 사진 타이머를 실행하고 전환해도 기존 카드 DOM을 유지", async () => {
    const original = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((query) => {
      const result = original(query);
      if (query === "(hover: none) and (prefers-reduced-motion: no-preference)")
        Object.defineProperty(result, "matches", { value: true });
      return result;
    });
    const intervals = vi.spyOn(window, "setInterval");
    const cleared = vi.spyOn(window, "clearInterval");
    const { container } = render(
      <ServiceTabs
        description="설명"
        cleaning={[service]}
        moving={[{ ...service, id: "moving", title: "이사 카드" }]}
      />,
    );
    const originalCard = container.querySelector(
      'a[href="/services#service-cleaning"]',
    );
    const intervalCalls = () =>
      intervals.mock.calls.filter((call) => call[1] === 3000);
    expect(intervalCalls()).toHaveLength(1);
    const firstTimer =
      intervals.mock.results[
        intervals.mock.calls.findIndex((call) => call[1] === 3000)
      ].value;
    fireEvent.click(screen.getByRole("button", { name: "이사" }));
    expect(intervalCalls()).toHaveLength(2);
    expect(cleared).toHaveBeenCalledWith(firstTimer);
    expect(screen.getByRole("heading", { name: "이사 카드" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "이사" }));
    expect(intervalCalls()).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "청소" }));
    expect(
      container.querySelector('a[href="/services#service-cleaning"]'),
    ).toBe(originalCard);
    expect(intervalCalls()).toHaveLength(3);
  });

  it("자동 전환은 터치 환경과 동작 줄이기 설정을 함께 확인", () => {
    const original = window.matchMedia.bind(window);
    const queries = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query) => {
        const result = original(query);
        Object.defineProperty(result, "matches", { value: false });
        return result;
      });
    const intervals = vi.spyOn(window, "setInterval");
    render(<ServiceGrid services={[service]} />);
    expect(queries).toHaveBeenCalledWith(
      "(hover: none) and (prefers-reduced-motion: no-preference)",
    );
    expect(
      intervals.mock.calls.filter((call) => call[1] === 3000),
    ).toHaveLength(0);
  });

  it("모바일 폭에서는 호버해도 사진과 설명이 위로 이동하지 않음", async () => {
    await page.viewport(390, 844);
    render(
      <ServiceGrid services={[{ ...service, afterImageUrl: undefined }]} />,
    );
    await act(async () => {
      await page.getByRole("link").hover();
    });
    const list = screen.getByRole("region", { name: "서비스 목록" });
    const image = list.querySelector("a > div");
    if (!(image instanceof HTMLElement)) throw new Error("이미지 영역 없음");
    await waitFor(() =>
      expect(getComputedStyle(image.closest("a")!).translate).toBe("none"),
    );
    expect(image.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      list.getBoundingClientRect().top,
    );
    const heading = screen.getByRole("heading", { name: "청소 카드" });
    expect(getComputedStyle(heading.parentElement!).translate).toBe("none");
  });
});
