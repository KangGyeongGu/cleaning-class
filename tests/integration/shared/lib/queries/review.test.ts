import { describe, it, expect, vi, beforeEach } from "vitest";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

interface ChainResult {
  data: unknown;
  error: unknown;
}

function makePromiseChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "contains",
    "order",
    "limit",
    "single",
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
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom })),
);
const mockCreateStaticClient = vi.hoisted(() =>
  vi.fn(() => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: mockCreateStaticClient,
}));
vi.mock("@/shared/lib/supabase/storage", () => ({
  getReviewImageUrl: vi.fn((p: string) =>
    p ? `https://cdn.example.com/r/${p}` : "",
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getReviews", () => {
  it("returns reviews with imageUrl mapped (default desc)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          { id: "r1", image_path: "a.jpg", title: "t", created_at: "2026" },
        ],
        error: null,
      }),
    );
    const { getReviews } = await import("@/shared/lib/queries/review");
    const result = await getReviews();
    expect(result[0].imageUrl).toContain("a.jpg");
  });

  it("supports ascending=true (oldest first)", async () => {
    const chain = makePromiseChain({ data: [], error: null });
    mockFrom.mockImplementation(() => chain);
    const { getReviews } = await import("@/shared/lib/queries/review");
    await getReviews(true);
    expect(mockFrom).toHaveBeenCalledWith("reviews");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("returns [] on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getReviews } = await import("@/shared/lib/queries/review");
    expect(await getReviews()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getReviews } = await import("@/shared/lib/queries/review");
    expect(await getReviews()).toEqual([]);
  });
});

describe("getAllPublishedReviews", () => {
  it("filters by is_published = true", async () => {
    const chain = makePromiseChain({ data: [], error: null });
    mockFrom.mockImplementation(() => chain);
    const { getAllPublishedReviews } =
      await import("@/shared/lib/queries/review");
    await getAllPublishedReviews();
    expect(chain.eq).toHaveBeenCalledWith("is_published", true);
  });
});

describe("getPublishedReviewsByCleaningTypes", () => {
  it("filters each category by is_published, tags, and PER_CATEGORY limit", async () => {
    const chain = makePromiseChain({ data: [], error: null });
    mockFrom.mockImplementation(() => chain);
    const { getPublishedReviewsByCleaningTypes } =
      await import("@/shared/lib/queries/review");
    await getPublishedReviewsByCleaningTypes();
    expect(chain.eq).toHaveBeenCalledWith("is_published", true);
    expect(chain.contains).toHaveBeenCalledWith("tags", [
      CLEANING_SERVICE_TYPES[0],
    ]);
    expect(chain.limit).toHaveBeenCalledWith(4);
  });
});

describe("getReviewById", () => {
  it("returns single review with imageUrl", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: { id: "r1", image_path: "a.jpg", title: "t" },
        error: null,
      }),
    );
    const { getReviewById } = await import("@/shared/lib/queries/review");
    const result = await getReviewById("r1");
    expect(result?.imageUrl).toContain("a.jpg");
  });

  it("returns null on error and logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getReviewById } = await import("@/shared/lib/queries/review");
    expect(await getReviewById("r1")).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null on null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getReviewById } = await import("@/shared/lib/queries/review");
    expect(await getReviewById("r1")).toBeNull();
  });
});
