import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/shared/lib/infra/track", () => ({
  track: vi.fn(),
  currentPath: () => "/",
}));

import { ServiceCard } from "@/components/service/ServiceCard.client";
import { track } from "@/shared/lib/infra/track";

function clickNoNav(el: Element): void {
  el.addEventListener("click", (e) => e.preventDefault());
  fireEvent.click(el);
}

const baseService = {
  id: "svc-1",
  title: "입주청소",
  description: "생활 중인 집의 주방과 욕실을 청소합니다.",
  imageUrl: "https://example.com/before.jpg",
  focalX: 50,
  focalY: 50,
  afterFocalX: 50,
  afterFocalY: 50,
};

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 900);
});

describe("ServiceCard (browser)", () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it.each(["사진", "설명"])(
    "%s에 호버해도 같은 카드 전체가 움직이고 사진은 확대되지 않음",
    async (target) => {
      await page.viewport(1280, 900);
      render(
        <div style={{ padding: 32, width: 280 }}>
          <ServiceCard service={baseService} />
        </div>,
      );
      const link = screen.getByRole("link");
      const outer = link.parentElement!;
      const photo = link.querySelector("img")!;
      const copy = screen.getByText(baseService.description).parentElement!;
      const before = {
        outer: outer.getBoundingClientRect().top,
        photo: photo.getBoundingClientRect().top,
        copy: copy.getBoundingClientRect().top,
      };
      const locator =
        target === "사진"
          ? page.getByRole("img", { name: baseService.title })
          : page.getByText(baseService.description);
      await act(async () => {
        await locator.hover();
      });
      await waitFor(() =>
        expect(getComputedStyle(link).translate).toBe("0px -6px"),
      );
      expect(outer.getBoundingClientRect().top).toBe(before.outer);
      expect(photo.getBoundingClientRect().top).toBeCloseTo(
        before.photo - 6,
        1,
      );
      expect(copy.getBoundingClientRect().top).toBeCloseTo(before.copy - 6, 1);
      expect(getComputedStyle(photo).scale).toBe("none");
      expect(getComputedStyle(copy).translate).toBe("none");
      expect(copy.closest("a")).toBe(link);
    },
  );

  it("should render service title and description", () => {
    render(<ServiceCard service={baseService} />);
    expect(screen.getByText("입주청소")).toBeTruthy();
    expect(screen.getByText(baseService.description)).toBeTruthy();
  });

  it("should link to anchor for the service id", () => {
    render(<ServiceCard service={baseService} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/services#service-svc-1");
  });

  it("should render only before image when afterImageUrl is absent", () => {
    render(<ServiceCard service={baseService} />);
    const images = document.querySelectorAll("img");
    expect(images.length).toBe(1);
  });

  it("should render both before/after images when afterImageUrl is provided", () => {
    render(
      <ServiceCard
        service={{
          ...baseService,
          afterImageUrl: "https://example.com/after.jpg",
        }}
      />,
    );
    const images = document.querySelectorAll("img");
    expect(images.length).toBe(2);
  });

  it("should track a cta_click carrying the service id when the card link is clicked", () => {
    render(<ServiceCard service={baseService} />);
    clickNoNav(screen.getByRole("link"));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      event_type: "cta_click",
      event_payload: { content_id: "service_card_svc-1" },
      path: "/",
    });
  });
});
