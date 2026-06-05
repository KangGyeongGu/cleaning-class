import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ServiceCard } from "@/components/service/ServiceCard";

const baseService = {
  id: "svc-1",
  title: "입주청소",
  tags: ["거주", "신규"],
  imageUrl: "https://example.com/before.jpg",
  focalX: 50,
  focalY: 50,
  afterFocalX: 50,
  afterFocalY: 50,
};

describe("ServiceCard (browser)", () => {
  it("should render service title and tags joined by middot", () => {
    render(<ServiceCard service={baseService} priority={false} />);
    expect(screen.getByText("입주청소")).toBeTruthy();
    expect(screen.getByText("거주 · 신규")).toBeTruthy();
  });

  it("should link to anchor for the service id", () => {
    render(<ServiceCard service={baseService} priority={false} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/services#service-svc-1");
  });

  it("should render only before image when afterImageUrl is absent", () => {
    render(<ServiceCard service={baseService} priority={false} />);
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
        priority={false}
      />,
    );
    const images = document.querySelectorAll("img");
    expect(images.length).toBe(2);
  });

  it("should mark after image visible immediately when showAfter is true", () => {
    render(
      <ServiceCard
        service={{
          ...baseService,
          afterImageUrl: "https://example.com/after.jpg",
        }}
        priority={false}
        showAfter
      />,
    );
    const afterImg = document.querySelectorAll("img")[1];
    expect(afterImg.className).toContain("opacity-100!");
  });
});
