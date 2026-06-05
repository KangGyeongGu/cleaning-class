import { describe, it, expect } from "vitest";
import { buildDescription } from "@/shared/lib/seo-description";

describe("buildDescription", () => {
  it("should return a non-empty marketing description", () => {
    const result = buildDescription();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should be within meta description length budget (<= 150 chars)", () => {
    expect(buildDescription().length).toBeLessThanOrEqual(150);
  });

  it("should mention the brand name", () => {
    expect(buildDescription()).toContain("청소클라쓰");
  });
});
