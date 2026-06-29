import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StarRating } from "@/components/review/StarRating";

type Fill = "full" | "half" | "empty";

function classifyStar(svg: SVGSVGElement): Fill {
  if (svg.querySelector("defs")) return "half";
  const path = svg.querySelector("path");
  return path?.getAttribute("fill") === "#0f172a" ? "full" : "empty";
}

function fillStates(container: HTMLElement): Fill[] {
  return Array.from(container.querySelectorAll("svg")).map((svg) =>
    classifyStar(svg as unknown as SVGSVGElement),
  );
}

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

  it("should render each star fill state for a rating below the .5 threshold", () => {
    render(<StarRating rating={2.4} />);
    const container = screen.getByRole("img", { name: /별점 2\.4점/ });
    expect(fillStates(container)).toEqual([
      "full",
      "full",
      "empty",
      "empty",
      "empty",
    ]);
  });

  it("should render a half star when the fractional part reaches 0.5", () => {
    render(<StarRating rating={2.5} />);
    const states = fillStates(screen.getByRole("img"));
    expect(states).toEqual(["full", "full", "half", "empty", "empty"]);

    const halfSvg = Array.from(
      screen.getByRole("img").querySelectorAll("svg"),
    )[2];
    const outline = halfSvg.querySelector('path[stroke="#cbd5e1"]');
    const clipped = halfSvg.querySelector("path[clip-path]");
    expect(outline?.getAttribute("fill")).toBe("none");
    expect(clipped?.getAttribute("fill")).toBe("#0f172a");
    expect(halfSvg.querySelector("defs rect")?.getAttribute("width")).toBe(
      "10",
    );
  });

  it("should respect custom size prop on svg width/height", () => {
    render(<StarRating rating={5} size={24} />);
    const container = screen.getByRole("img");
    const firstSvg = container.querySelector("svg");
    expect(firstSvg?.getAttribute("width")).toBe("24");
    expect(firstSvg?.getAttribute("height")).toBe("24");
  });
});
