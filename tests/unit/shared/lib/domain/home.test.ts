import { describe, it, expect, vi, beforeEach } from "vitest";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

interface ChainResult {
  data: unknown;
  error: unknown;
}

function makePromiseChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "contains", "order", "limit"]) {
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

describe("getPublishedReviews", () => {
  it("dedupes reviews that appear in multiple category queries", async () => {
    const r1 = { id: "r1", created_at: "2026-01-01T00:00:00Z", tags: [] };
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [r1], error: null }),
    );
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getPublishedReviews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
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
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getPublishedReviews();
    expect(result[0].id).toBe("new");
  });

  it("skips a category when its query returns error (and warns)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: null, error: { message: "RLS" } }
          : { data: [{ id: "r1", created_at: "2026-01-01" }], error: null },
      ),
    );
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getPublishedReviews();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns [] on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getPublishedReviews();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("uses 5 category queries (one per CLEANING_SERVICE_TYPES entry)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [], error: null }),
    );
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    await getPublishedReviews();
    expect(mockFrom).toHaveBeenCalledTimes(CLEANING_SERVICE_TYPES.length);
  });

  it("handles null data array gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getPublishedReviews();
    expect(result).toEqual([]);
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
    const { getAllPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getAllPublishedReviews();
    expect(result).toHaveLength(1);
  });

  it("returns [] on DB error and logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getAllPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getAllPublishedReviews();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns [] on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("net");
    });
    const { getAllPublishedReviews } = await import("@/shared/lib/domain/home");
    const result = await getAllPublishedReviews();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getAllPublishedReviews } = await import("@/shared/lib/domain/home");
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
      await import("@/shared/lib/domain/home");
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
      await import("@/shared/lib/domain/home");
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
      await import("@/shared/lib/domain/home");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].afterFocalX).toBe(50);
    expect(result[0].afterFocalY).toBe(50);
  });

  it("defaults tags to [] when null", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [{ ...baseService, tags: null }], error: null }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/domain/home");
    const result = await getPublishedServicesWithImageUrls();
    expect(result[0].tags).toEqual([]);
  });

  it("returns [] on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/domain/home");
    expect(await getPublishedServicesWithImageUrls()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("returns [] on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("x");
    });
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/domain/home");
    expect(await getPublishedServicesWithImageUrls()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPublishedServicesWithImageUrls } =
      await import("@/shared/lib/domain/home");
    expect(await getPublishedServicesWithImageUrls()).toEqual([]);
  });
});

describe("getCustomerReviews", () => {
  it("returns customer reviews on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [{ id: "cr1", rating: 5, comment: "x" }],
        error: null,
      }),
    );
    const { getCustomerReviews } = await import("@/shared/lib/domain/home");
    const result = await getCustomerReviews();
    expect(result).toHaveLength(1);
  });

  it("returns [] on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getCustomerReviews } = await import("@/shared/lib/domain/home");
    expect(await getCustomerReviews()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("returns [] on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("x");
    });
    const { getCustomerReviews } = await import("@/shared/lib/domain/home");
    expect(await getCustomerReviews()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getCustomerReviews } = await import("@/shared/lib/domain/home");
    expect(await getCustomerReviews()).toEqual([]);
  });
});
