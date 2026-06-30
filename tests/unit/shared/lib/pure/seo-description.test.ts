import { describe, it, expect } from "vitest";
import { HOME_META_DESCRIPTION } from "@/shared/lib/pure/constants";

describe("HOME_META_DESCRIPTION", () => {
  it("should be a non-empty marketing description", () => {
    expect(HOME_META_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it("should be within meta description length budget (<= 150 chars)", () => {
    expect(HOME_META_DESCRIPTION.length).toBeLessThanOrEqual(150);
  });

  it("should mention the brand name", () => {
    expect(HOME_META_DESCRIPTION).toContain("청소클라쓰");
  });
});
