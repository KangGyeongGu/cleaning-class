import { describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "@/shared/lib/server/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests while under the limit", () => {
    expect(checkRateLimit("under", 3, 1000)).toBe(true);
    expect(checkRateLimit("under", 3, 1000)).toBe(true);
    expect(checkRateLimit("under", 3, 1000)).toBe(true);
  });

  it("blocks once the limit is reached within the window", () => {
    expect(checkRateLimit("over", 2, 1000)).toBe(true);
    expect(checkRateLimit("over", 2, 1000)).toBe(true);
    expect(checkRateLimit("over", 2, 1000)).toBe(false);
  });

  it("allows again after timestamps fall outside the window", () => {
    vi.useFakeTimers();
    try {
      expect(checkRateLimit("expire", 1, 1000)).toBe(true);
      expect(checkRateLimit("expire", 1, 1000)).toBe(false);
      vi.advanceTimersByTime(1001);
      expect(checkRateLimit("expire", 1, 1000)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
