import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ single: mockSingle })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));
const mockCreateStaticClient = vi.hoisted(() =>
  vi.fn(() => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: mockCreateStaticClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getSiteConfig", () => {
  it("returns data when supabase responds without error", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "c0", business_name: "x" },
      error: null,
    });
    const { getSiteConfig } = await import("@/shared/lib/domain/site-config");
    const result = await getSiteConfig();
    expect(result).toEqual({ id: "c0", business_name: "x" });
    expect(mockFrom).toHaveBeenCalledWith("site_config");
  });

  it("returns null when supabase returns error", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });
    const { getSiteConfig } = await import("@/shared/lib/domain/site-config");
    const result = await getSiteConfig();
    expect(result).toBeNull();
  });

  it("returns null when supabase call throws", async () => {
    mockSingle.mockRejectedValueOnce(new Error("network"));
    const { getSiteConfig } = await import("@/shared/lib/domain/site-config");
    const result = await getSiteConfig();
    expect(result).toBeNull();
  });
});
