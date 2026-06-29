import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/lib/infra/track", () => ({
  track: vi.fn(),
  currentPath: () => "/",
}));

import { HeroCTA } from "@/components/hero/HeroCTA.client";
import { track } from "@/shared/lib/infra/track";

function clickNoNav(el: Element): void {
  el.addEventListener("click", (e) => e.preventDefault());
  fireEvent.click(el);
}

describe("HeroCTA (browser)", () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it("should render quote CTA link to /contact", () => {
    render(<HeroCTA />);
    const cta = screen.getByRole("link", { name: /무료 견적 받기/ });
    expect(cta.getAttribute("href")).toBe("/contact");
  });

  it("should hide phone block when no phone props provided", () => {
    render(<HeroCTA />);
    expect(screen.queryByText("청소상담")).toBeNull();
    expect(screen.queryByText("이사상담")).toBeNull();
  });

  it("should render cleaning phone when phone prop provided", () => {
    render(<HeroCTA phone="010-1111-2222" />);
    expect(screen.getByText("청소상담")).toBeTruthy();
    const tel = screen.getByRole("link", { name: "010-1111-2222" });
    expect(tel.getAttribute("href")).toBe("tel:010-1111-2222");
  });

  it("should render moving phone when movingPhone prop provided", () => {
    render(<HeroCTA movingPhone="010-3333-4444" />);
    expect(screen.getByText("이사상담")).toBeTruthy();
    const tel = screen.getByRole("link", { name: "010-3333-4444" });
    expect(tel.getAttribute("href")).toBe("tel:010-3333-4444");
  });

  it("should apply dark variant styling on CTA link", () => {
    render(<HeroCTA variant="dark" phone="010-5555-6666" />);
    const cta = screen.getByRole("link", { name: /무료 견적 받기/ });
    expect(cta.className).toContain("border-white");
    expect(cta.className).toContain("text-white");
  });

  it("should apply light variant styling by default", () => {
    render(<HeroCTA phone="010-5555-6666" />);
    const cta = screen.getByRole("link", { name: /무료 견적 받기/ });
    expect(cta.className).toContain("border-slate-900");
  });

  it("should track a cta_click when the quote CTA is clicked", () => {
    render(<HeroCTA />);
    clickNoNav(screen.getByRole("link", { name: /무료 견적 받기/ }));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      event_type: "cta_click",
      event_payload: { content_id: "hero_quote_button" },
      path: "/",
    });
  });

  it("should track phone_click with the matching phone_type for each tel link", () => {
    render(<HeroCTA phone="010-1111-2222" movingPhone="010-3333-4444" />);
    clickNoNav(screen.getByRole("link", { name: "010-1111-2222" }));
    clickNoNav(screen.getByRole("link", { name: "010-3333-4444" }));
    expect(track).toHaveBeenNthCalledWith(1, {
      event_type: "phone_click",
      event_payload: { phone_type: "cleaning", click_location: "hero_cta" },
      path: "/",
    });
    expect(track).toHaveBeenNthCalledWith(2, {
      event_type: "phone_click",
      event_payload: { phone_type: "moving", click_location: "hero_cta" },
      path: "/",
    });
  });
});
