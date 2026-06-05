import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getAdminDashboardData", () => {
  it("returns 5 counts on success", async () => {
    mockSelect
      .mockResolvedValueOnce({ count: 12, error: null })
      .mockResolvedValueOnce({ count: 491, error: null })
      .mockResolvedValueOnce({ count: 38, error: null })
      .mockResolvedValueOnce({ count: 7, error: null })
      .mockResolvedValueOnce({ count: 3, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    const result = await getAdminDashboardData();
    expect(result).toEqual({
      serviceCount: 12,
      reviewCount: 491,
      customerReviewCount: 38,
      faqCount: 7,
      priceCount: 3,
    });
  });

  it("returns 0 for null counts (fresh DB)", async () => {
    mockSelect
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    expect(await getAdminDashboardData()).toEqual({
      serviceCount: 0,
      reviewCount: 0,
      customerReviewCount: 0,
      faqCount: 0,
      priceCount: 0,
    });
  });

  it("logs each error category independently (service)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: null, error: { message: "s" } })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    const r = await getAdminDashboardData();
    expect(r.serviceCount).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs each error category independently (review)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: null, error: { message: "r" } })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    await getAdminDashboardData();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs each error category independently (customer review)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: null, error: { message: "c" } })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    await getAdminDashboardData();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs each error category independently (faq)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: null, error: { message: "f" } })
      .mockResolvedValueOnce({ count: 1, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    await getAdminDashboardData();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs each error category independently (price)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: 1, error: null })
      .mockResolvedValueOnce({ count: null, error: { message: "p" } });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    await getAdminDashboardData();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
