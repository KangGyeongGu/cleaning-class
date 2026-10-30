import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("ServiceCard (browser)", () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

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
