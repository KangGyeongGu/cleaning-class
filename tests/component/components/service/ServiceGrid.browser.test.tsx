import "@/app/globals.css";
import { page } from "vitest/browser";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceGrid } from "@/components/service/ServiceGrid.client";

const services = Array.from({ length: 5 }, (_, index) => ({
  id: `service-${index}`,
  title: `서비스 ${index + 1}`,
  description:
    "생활 중인 집의 주방과 욕실 등 공간 전반을 청소합니다. 필요한 부분만 청소할 수도 있습니다.",
  imageUrl: "",
}));

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 900);
});

describe("서비스 목록 반응형 배치", () => {
  it("모바일은 첫 카드와 마지막 카드가 중앙에 정렬되고 도트가 스크롤 위치를 표시", async () => {
    await page.viewport(390, 844);
    render(
      <div style={{ padding: 16 }}>
        <ServiceGrid services={services} />
      </div>,
    );
    const list = screen.getByRole("region", { name: "서비스 목록" });
    const first = list.children[0].getBoundingClientRect();
    const center = list.getBoundingClientRect().left + list.clientWidth / 2;
    expect(Math.abs(first.left + first.width / 2 - center)).toBeLessThan(2);
    expect(first.width).toBeLessThan(list.clientWidth);
    expect(first.width).toBeGreaterThan(list.clientWidth * 0.8);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
    expect(
      screen.getByRole("img", { name: "서비스 5개 중 1번째" }).children,
    ).toHaveLength(5);
    expect(screen.queryByRole("button")).toBeNull();
    await act(async () =>
      list.scrollTo({ left: list.scrollWidth, behavior: "instant" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "서비스 5개 중 5번째" }),
      ).toBeTruthy(),
    );
    expect(
      Math.abs(
        list.children[4].getBoundingClientRect().left +
          list.children[4].getBoundingClientRect().width / 2 -
          center,
      ),
    ).toBeLessThan(2);
  });

  it("PC에서는 다섯 카드가 같은 행에 보이고 도트가 숨겨짐", async () => {
    await page.viewport(1280, 900);
    render(<ServiceGrid services={services} />);
    const list = screen.getByRole("region", { name: "서비스 목록" });
    const tops = Array.from(list.children).map(
      (card) => card.getBoundingClientRect().top,
    );
    expect(new Set(tops).size).toBe(1);
    expect(list.scrollWidth).toBe(list.clientWidth);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
