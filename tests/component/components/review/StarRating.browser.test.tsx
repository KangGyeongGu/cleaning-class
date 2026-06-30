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
  it("should round down below the .5 threshold (no half star)", () => {
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

  it("should render a half star once the fractional part reaches 0.5", () => {
    render(<StarRating rating={2.5} />);
    const container = screen.getByRole("img");
    expect(fillStates(container)).toEqual([
      "full",
      "full",
      "half",
      "empty",
      "empty",
    ]);

    const halfSvg = Array.from(container.querySelectorAll("svg"))[2];
    expect(halfSvg.querySelector("path[clip-path]")?.getAttribute("fill")).toBe(
      "#0f172a",
    );
    expect(halfSvg.querySelector("defs rect")?.getAttribute("width")).toBe(
      "10",
    );
  });
});
