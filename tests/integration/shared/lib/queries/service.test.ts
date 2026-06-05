import { describe, it, expect, vi, beforeEach } from "vitest";

interface ChainResult {
  data: unknown;
  error: unknown;
}

function makePromiseChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit", "single"]) {
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

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@/shared/lib/supabase/storage", () => ({
  getServiceImageUrl: vi.fn((p: string) =>
    p ? `https://cdn.example.com/${p}` : "",
  ),
}));

const fullService = {
  id: "s1",
  title: "거주청소",
  image_path: "main.jpg",
  image_after_path: "after.jpg",
  detail_image_path: "detail.jpg",
  detail_image_after_path: "detail-after.jpg",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getServices", () => {
  it("returns services with mapped image URLs", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: [fullService], error: null }),
    );
    const { getServices } = await import("@/shared/lib/queries/service");
    const result = await getServices();
    expect(result[0].imageUrl).toContain("main.jpg");
    expect(result[0].afterImageUrl).toContain("after.jpg");
    expect(result[0].detailImageUrl).toContain("detail.jpg");
    expect(result[0].detailAfterImageUrl).toContain("detail-after.jpg");
  });

  it("omits optional image URLs when paths empty", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          {
            ...fullService,
            image_after_path: "",
            detail_image_path: "",
            detail_image_after_path: "",
          },
        ],
        error: null,
      }),
    );
    const { getServices } = await import("@/shared/lib/queries/service");
    const result = await getServices();
    expect(result[0].afterImageUrl).toBeUndefined();
    expect(result[0].detailImageUrl).toBeUndefined();
    expect(result[0].detailAfterImageUrl).toBeUndefined();
  });

  it("returns [] on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getServices } = await import("@/shared/lib/queries/service");
    expect(await getServices()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("handles null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getServices } = await import("@/shared/lib/queries/service");
    expect(await getServices()).toEqual([]);
  });
});

describe("getServiceById", () => {
  it("returns single service with mapped URLs", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: fullService, error: null }),
    );
    const { getServiceById } = await import("@/shared/lib/queries/service");
    const result = await getServiceById("s1");
    expect(result?.imageUrl).toContain("main.jpg");
    expect(result?.afterImageUrl).toContain("after.jpg");
  });

  it("omits optional URLs when paths empty", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: {
          ...fullService,
          image_after_path: "",
          detail_image_path: "",
          detail_image_after_path: "",
        },
        error: null,
      }),
    );
    const { getServiceById } = await import("@/shared/lib/queries/service");
    const result = await getServiceById("s1");
    expect(result?.afterImageUrl).toBeUndefined();
    expect(result?.detailImageUrl).toBeUndefined();
    expect(result?.detailAfterImageUrl).toBeUndefined();
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getServiceById } = await import("@/shared/lib/queries/service");
    expect(await getServiceById("s1")).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null on null data without error", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getServiceById } = await import("@/shared/lib/queries/service");
    expect(await getServiceById("s1")).toBeNull();
  });
});

describe("getNextServiceSortOrder", () => {
  it("returns max + 1", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { sort_order: 7 }, error: null }),
    );
    const { getNextServiceSortOrder } =
      await import("@/shared/lib/queries/service");
    expect(await getNextServiceSortOrder()).toBe(8);
  });

  it("returns 0 silently on PGRST116", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: null,
        error: { code: "PGRST116", message: "no rows" },
      }),
    );
    const { getNextServiceSortOrder } =
      await import("@/shared/lib/queries/service");
    expect(await getNextServiceSortOrder()).toBe(0);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 0 + logs on other errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: null,
        error: { code: "OTHER", message: "x" },
      }),
    );
    const { getNextServiceSortOrder } =
      await import("@/shared/lib/queries/service");
    expect(await getNextServiceSortOrder()).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 0 when sort_order null", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { sort_order: null }, error: null }),
    );
    const { getNextServiceSortOrder } =
      await import("@/shared/lib/queries/service");
    expect(await getNextServiceSortOrder()).toBe(0);
  });
});
