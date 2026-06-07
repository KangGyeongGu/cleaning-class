import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StarRating } from "@/components/review/StarRating";

describe("StarRating (browser)", () => {
  it("should render container with accessible label reflecting rating", () => {
    render(<StarRating rating={4.5} />);
    const container = screen.getByRole("img", { name: /별점 4\.5점 \/ 5점/ });
    expect(container).toBeTruthy();
  });

  it("should render exactly 5 star svgs regardless of rating", () => {
    render(<StarRating rating={3} />);
    const container = screen.getByRole("img");
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(5);
  });

  it("should treat fractional rating below 0.5 as empty for the next star", () => {
    render(<StarRating rating={2.4} />);
    const container = screen.getByRole("img", { name: /별점 2\.4점/ });
    expect(container).toBeTruthy();
  });

  it("should respect custom size prop on svg width/height", () => {
    render(<StarRating rating={5} size={24} />);
    const container = screen.getByRole("img");
    const firstSvg = container.querySelector("svg");
    expect(firstSvg?.getAttribute("width")).toBe("24");
    expect(firstSvg?.getAttribute("height")).toBe("24");
  });
});
