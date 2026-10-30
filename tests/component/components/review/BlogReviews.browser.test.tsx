import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BlogReviews } from "@/components/review/BlogReviews.client";

const reviews = Array.from({ length: 18 }, (_, index) => ({
  id: `review-${index}`,
  title: `작업 ${index + 1}`,
  summary: "작업 내용",
  tags: [index < 9 ? "거주청소" : "정기청소"],
  image_path: "",
  imageUrl:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  link_url: "",
  is_published: true,
  created_at: new Date(Date.UTC(2026, 9, 30 - index)).toISOString(),
  updated_at: new Date(Date.UTC(2026, 9, 30 - index)).toISOString(),
}));

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 900);
});

describe("메인 작업 사례 미리보기", () => {
  it.each([1280])(
    "너비 %s에서 최신 사례 7개와 전체보기 카드가 표시되고 끝까지 탐색 가능",
    async (width) => {
      await page.viewport(width, 900);
      render(
        <BlogReviews
          reviews={reviews}
          counts={{ all: 123, 거주청소: 80, 정기청소: 43 }}
        />,
      );
      const list = screen.getByRole("region", { name: "작업 사례 목록" });
      expect(list.children).toHaveLength(8);
      expect(
        within(list)
          .getAllByRole("heading")
          .map((heading) => heading.textContent),
      ).toEqual(reviews.slice(0, 7).map((review) => review.title));
      const more = within(list).getByRole("link", {
        name: "작업 사례 전체보기",
      });
      expect(more.getAttribute("href")).toBe("/reviews");
      expect(within(more).getByText("총 123건")).toBeTruthy();
      const next = (await screen.findByRole("button", {
        name: "다음 작업 사례",
      })) as HTMLButtonElement;
      await waitFor(() => expect(next.disabled).toBe(false));
      for (let index = 0; index < (width >= 1280 ? 1 : 7); index++) {
        const step =
          list.children[0].getBoundingClientRect().width +
          Number.parseFloat(getComputedStyle(list).columnGap);
        const target = Math.min(
          list.scrollLeft + step * (width >= 1280 ? 4 : 1),
          list.scrollWidth - list.clientWidth,
        );
        fireEvent.click(next);
        await waitFor(() =>
          expect(Math.abs(list.scrollLeft - target)).toBeLessThan(2),
        );
      }
      await waitFor(() => expect(next.disabled).toBe(true));
      expect(getComputedStyle(next).visibility).toBe("hidden");
      expect(more.querySelectorAll("img")).toHaveLength(28);
      expect(more.getBoundingClientRect().right).toBeLessThanOrEqual(
        list.getBoundingClientRect().right + 1,
      );
    },
  );

  it("모바일은 화살표 없이 스와이프하고 도트가 현재 카드를 표시하며 필터 끝에서는 페이드가 사라짐", async () => {
    await page.viewport(390, 900);
    render(
      <BlogReviews
        reviews={reviews}
        counts={{ all: 123, 거주청소: 80, 정기청소: 43 }}
      />,
    );
    const list = screen.getByRole("region", { name: "작업 사례 목록" });
    expect(screen.queryByRole("button", { name: "다음 작업 사례" })).toBeNull();
    expect(screen.queryByRole("button", { name: "이전 작업 사례" })).toBeNull();
    expect(list.getBoundingClientRect().left).toBe(16);
    expect(list.getBoundingClientRect().right).toBe(374);
    const bounds = list.getBoundingClientRect();
    const first = list.children[0].getBoundingClientRect();
    const second = list.children[1].getBoundingClientRect();
    expect(first.width).toBeLessThan(list.clientWidth * 0.9);
    expect(
      Math.abs(
        first.left + first.width / 2 - (bounds.left + list.clientWidth / 2),
      ),
    ).toBeLessThan(2);
    expect(second.left).toBeLessThan(bounds.right);
    expect(second.right).toBeGreaterThan(bounds.right);
    expect(
      screen.getByRole("img", { name: "작업 사례 카드 8개 중 1번째" }).children,
    ).toHaveLength(8);
    await act(async () =>
      list.scrollTo({ left: list.scrollWidth, behavior: "instant" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "작업 사례 카드 8개 중 8번째" }),
      ).toBeTruthy(),
    );
    const last = list.lastElementChild!.getBoundingClientRect();
    expect(
      Math.abs(
        last.left + last.width / 2 - (bounds.left + list.clientWidth / 2),
      ),
    ).toBeLessThan(2);
    fireEvent.click(screen.getByRole("button", { name: "정기청소" }));
    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: "작업 사례 카드 8개 중 1번째" }),
      ).toBeTruthy(),
    );
    const filters = screen.getByRole("group", { name: "작업 사례 종류" });
    const frame = filters.parentElement!;
    await act(async () => filters.scrollTo({ left: 0, behavior: "instant" }));
    await waitFor(() =>
      expect(frame.querySelector(":scope > span")).toBeTruthy(),
    );
    await act(async () =>
      filters.scrollTo({ left: filters.scrollWidth, behavior: "instant" }),
    );
    await waitFor(() =>
      expect(frame.querySelector(":scope > span")).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "상가청소" }).getBoundingClientRect()
        .right,
    ).toBeLessThan(frame.getBoundingClientRect().right - 8);
  });

  it("유형 변경 시 해당 최신 7개를 표시하고 제목과 전체보기 카드에 같은 필터 URL을 사용", () => {
    render(
      <BlogReviews
        reviews={reviews}
        counts={{ all: 123, 거주청소: 80, 정기청소: 43 }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "정기청소" }));
    const list = screen.getByRole("region", { name: "작업 사례 목록" });
    expect(list.children).toHaveLength(8);
    expect(
      within(list)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(
      reviews
        .filter((review) => review.tags.includes("정기청소"))
        .slice(0, 7)
        .map((review) => review.title),
    );
    const href = within(list)
      .getByRole("link", { name: "정기청소 전체보기" })
      .getAttribute("href");
    expect(screen.getByText("총 43건")).toBeTruthy();
    expect(new URLSearchParams(href?.split("?")[1]).get("filter")).toBe(
      "정기청소",
    );
    expect(
      screen.getByRole("link", { name: "작업 사례" }).getAttribute("href"),
    ).toBe(href);
  });
});
