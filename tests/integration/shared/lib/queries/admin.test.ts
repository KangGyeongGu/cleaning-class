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
  it("returns aggregated counts on success", async () => {
    mockSelect
      .mockResolvedValueOnce({ count: 12, error: null })
      .mockResolvedValueOnce({ count: 491, error: null })
      .mockResolvedValueOnce({ count: 7, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    const result = await getAdminDashboardData();
    expect(result).toEqual({
      serviceCount: 12,
      reviewCount: 491,
      faqCount: 7,
    });
  });

  it("returns 0 for null counts (fresh DB)", async () => {
    mockSelect
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null })
      .mockResolvedValueOnce({ count: null, error: null });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    expect(await getAdminDashboardData()).toEqual({
      serviceCount: 0,
      reviewCount: 0,
      faqCount: 0,
    });
  });

  it("logs and continues when service count errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSelect
      .mockResolvedValueOnce({ count: null, error: { message: "x" } })
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
      .mockResolvedValueOnce({ count: null, error: { message: "f" } });
    const { getAdminDashboardData } =
      await import("@/shared/lib/queries/admin");
    await getAdminDashboardData();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
