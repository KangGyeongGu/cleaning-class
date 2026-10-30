import { describe, it, expect, vi, beforeEach } from "vitest";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

interface ChainResult {
  data: unknown;
  error: unknown;
  count?: number | null;
}

function makePromiseChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "contains",
    "overlaps",
    "order",
    "limit",
  ]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (
    onfulfilled?: (v: ChainResult) => unknown,
    onrejected?: (r: unknown) => unknown,
  ) => promise.then(onfulfilled, onrejected);
  return chain;
}

const mockFrom = vi.hoisted(() => vi.fn());
const mockCreateStaticClient = vi.hoisted(() =>
  vi.fn(() => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: mockCreateStaticClient,
}));

vi.mock("@/shared/lib/supabase/storage", () => ({
  getServiceImageUrl: vi.fn((p: string) =>
    p ? `https://cdn.example.com/${p}` : "",
  ),
  getReviewImageUrl: vi.fn((p: string) =>
    p ? `https://cdn.example.com/r/${p}` : "",
  ),
  getHeroImageUrl: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getHomeReviewData", () => {
  it("returns exact totals beyond the preview limit without summing overlapping category counts", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      const index = call++;
      return makePromiseChain({
        data:
          index < CLEANING_SERVICE_TYPES.length
            ? [{ id: "shared", created_at: "2026-01-01" }]
            : null,
        error: null,
        count: index < CLEANING_SERVICE_TYPES.length ? 20 + index : 73,
      });
    });
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    const result = await getHomeReviewData();
    expect(result.reviews).toHaveLength(1);
    expect(result.counts.all).toBe(73);
    expect(result.counts[CLEANING_SERVICE_TYPES[0]]).toBe(20);
  });

  it("throws when the overall count fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ < CLEANING_SERVICE_TYPES.length
          ? {
              data: [{ id: "r1", created_at: "2026-01-01" }],
              error: null,
              count: 12,
            }
          : { data: null, error: { message: "count failed" }, count: null },
      ),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    await expect(getHomeReviewData()).rejects.toMatchObject({
      message: "count failed",
    });
    consoleSpy.mockRestore();
  });

  it("dedupes reviews that appear in multiple category queries", async () => {
    const r1 = { id: "r1", created_at: "2026-01-01T00:00:00Z", tags: [] };
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [r1], error: null }),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    const result = await getHomeReviewData();
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].id).toBe("r1");
  });

  it("sorts by created_at desc across categories", async () => {
    let call = 0;
    const variants: ChainResult[] = [
      {
        data: [{ id: "old", created_at: "2026-01-01T00:00:00Z" }],
        error: null,
      },
      {
        data: [{ id: "new", created_at: "2026-05-01T00:00:00Z" }],
        error: null,
      },
    ];
    mockFrom.mockImplementation(() =>
      makePromiseChain(variants[Math.min(call++, variants.length - 1)]),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    const result = await getHomeReviewData();
    expect(result.reviews[0].id).toBe("new");
  });

  it("throws when a category query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: null, error: { message: "RLS" } }
          : { data: [{ id: "r1", created_at: "2026-01-01" }], error: null },
      ),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    await expect(getHomeReviewData()).rejects.toMatchObject({ message: "RLS" });
    consoleSpy.mockRestore();
  });

  it("throws on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    await expect(getHomeReviewData()).rejects.toThrow("boom");
    consoleSpy.mockRestore();
  });

  it("uses category previews and one separate overall count", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [], error: null }),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    await getHomeReviewData();
    expect(mockFrom).toHaveBeenCalledTimes(CLEANING_SERVICE_TYPES.length + 1);
  });

  it("handles null data array gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getHomeReviewData } = await import("@/shared/lib/queries/review");
    const result = await getHomeReviewData();
    expect(result.reviews).toEqual([]);
  });
});

describe("getAllPublishedReviews", () => {
  it("returns reviews on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [{ id: "r1", created_at: "2026-01-01" }],
        error: null,
      }),
    );
    const { getAllPublishedReviews } =
      await import("@/shared/lib/queries/review");
    const result = await getAllPublishedReviews();
    expect(result).toHaveLength(1);
  });

  it("throws on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getAllPublishedReviews } =
      await import("@/shared/lib/queries/review");
    await expect(getAllPublishedReviews()).rejects.toMatchObject({
      message: "x",
    });
    consoleSpy.mockRestore();
  });

  it("throws on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("net");
    });
    const { getAllPublishedReviews } =
      await import("@/shared/lib/queries/review");
    await expect(getAllPublishedReviews()).rejects.toThrow("net");
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getAllPublishedReviews } =
      await import("@/shared/lib/queries/review");
    const result = await getAllPublishedReviews();
    expect(result).toEqual([]);
  });
});

describe("getPublishedServicesWithImageUrls", () => {
  const baseService = {
    id: "s1",
    title: "거주청소",
    description: "거주청소 서비스",
    category: "cleaning",
    tags: ["원룸"],
    image_path: "before.jpg",
    image_after_path: "after.jpg",
    detail_image_path: "detail.jpg",
    detail_image_after_path: "detail-after.jpg",
    image_focal_x: 50,
    image_focal_y: 50,
    image_after_focal_x: 60,
    image_after_focal_y: 70,
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
  };

  it("maps full service to ServiceWithImageUrls", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [baseService], error: null }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].imageUrl).toContain("before.jpg");
    expect(result[0].afterImageUrl).toContain("after.jpg");
    expect(result[0].detailImageUrl).toContain("detail.jpg");
    expect(result[0].detailAfterImageUrl).toContain("detail-after.jpg");
  });

  it("omits optional image URLs when paths are empty", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          {
            ...baseService,
            image_after_path: "",
            detail_image_path: "",
            detail_image_after_path: "",
          },
        ],
        error: null,
      }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].afterImageUrl).toBeUndefined();
    expect(result[0].detailImageUrl).toBeUndefined();
    expect(result[0].detailAfterImageUrl).toBeUndefined();
  });

  it("defaults focal x/y to 50 when null", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          {
            ...baseService,
            image_after_focal_x: null,
            image_after_focal_y: null,
          },
        ],
        error: null,
      }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].afterFocalX).toBe(50);
    expect(result[0].afterFocalY).toBe(50);
  });

  it("returns the description without exposing legacy tags", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [{ ...baseService, tags: null }], error: null }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].description).toBe(baseService.description);
    expect(result[0]).not.toHaveProperty("tags");
  });

  it("throws on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    await expect(getPublishedServicesWithImageUrls()).rejects.toMatchObject({
      message: "x",
    });
    consoleSpy.mockRestore();
  });

  it("throws on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("x");
    });
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    await expect(getPublishedServicesWithImageUrls()).rejects.toMatchObject({
      message: "x",
    });
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    expect(await getPublishedServicesWithImageUrls()).toEqual([]);
  });

  it("filters by category when provided", async () => {
    const chain = makePromiseChain({ data: [baseService], error: null });
    mockFrom.mockImplementation(() => chain);
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/queries/service");
    await getPublishedServicesWithImageUrls("cleaning");
    expect(chain.eq).toHaveBeenCalledWith("category", "cleaning");
  });
});

describe("getPublishedCustomerReviews", () => {
  it("returns customer reviews on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [{ id: "cr1", rating: 5, comment: "x" }],
        error: null,
      }),
    );
    const { getPublishedCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    const result = await getPublishedCustomerReviews();
    expect(result).toHaveLength(1);
  });

  it("throws on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getPublishedCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    await expect(getPublishedCustomerReviews()).rejects.toMatchObject({
      message: "x",
    });
    consoleSpy.mockRestore();
  });

  it("throws on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("x");
    });
    const { getPublishedCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    await expect(getPublishedCustomerReviews()).rejects.toMatchObject({
      message: "x",
    });
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPublishedCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    expect(await getPublishedCustomerReviews()).toEqual([]);
  });
});
