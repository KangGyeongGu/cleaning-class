import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroCTA } from "@/components/hero/HeroCTA";

describe("HeroCTA (browser)", () => {
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
});
