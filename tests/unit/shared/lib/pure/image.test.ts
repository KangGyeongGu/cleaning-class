import { describe, it, expect } from "vitest";
import { BLUR_PLACEHOLDER } from "@/shared/lib/pure/constants";

describe("BLUR_PLACEHOLDER", () => {
  it("is a data URL with image/webp MIME", () => {
    expect(BLUR_PLACEHOLDER).toMatch(/^data:image\/webp;base64,/);
  });

  it("is non-empty base64 payload", () => {
    const payload = BLUR_PLACEHOLDER.split(",")[1];
    expect(payload.length).toBeGreaterThan(0);
  });
});
