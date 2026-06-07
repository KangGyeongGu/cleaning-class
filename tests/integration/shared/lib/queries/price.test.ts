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
const mockCreateStaticClient = vi.hoisted(() =>
  vi.fn(() => ({ from: mockFrom })),
);

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: mockCreateStaticClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getPublishedPriceItems", () => {
  it("returns published items", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [{ id: "p1", name: "x", price_won: 100000 }],
        error: null,
      }),
    );
    const { getPublishedPriceItems } =
      await import("@/shared/lib/queries/price");
    expect(await getPublishedPriceItems()).toHaveLength(1);
  });

  it("returns [] on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getPublishedPriceItems } =
      await import("@/shared/lib/queries/price");
    expect(await getPublishedPriceItems()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("returns [] on null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPublishedPriceItems } =
      await import("@/shared/lib/queries/price");
    expect(await getPublishedPriceItems()).toEqual([]);
  });
});

describe("getAllPriceItems", () => {
  it("returns all items including unpublished", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          { id: "p1", is_published: true },
          { id: "p2", is_published: false },
        ],
        error: null,
      }),
    );
    const { getAllPriceItems } = await import("@/shared/lib/queries/price");
    expect(await getAllPriceItems()).toHaveLength(2);
  });

  it("returns [] on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getAllPriceItems } = await import("@/shared/lib/queries/price");
    expect(await getAllPriceItems()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("returns [] on null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getAllPriceItems } = await import("@/shared/lib/queries/price");
    expect(await getAllPriceItems()).toEqual([]);
  });
});

describe("getPriceItemById", () => {
  it("returns single item by id", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: { id: "p1", name: "x", price_won: 100000 },
        error: null,
      }),
    );
    const { getPriceItemById } = await import("@/shared/lib/queries/price");
    expect(await getPriceItemById("p1")).toEqual({
      id: "p1",
      name: "x",
      price_won: 100000,
    });
  });

  it("returns null on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getPriceItemById } = await import("@/shared/lib/queries/price");
    expect(await getPriceItemById("p1")).toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns null when data null without error", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getPriceItemById } = await import("@/shared/lib/queries/price");
    expect(await getPriceItemById("p1")).toBeNull();
  });
});

describe("getNextPriceItemSortOrder", () => {
  it("returns max sort_order + 1", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { sort_order: 10 }, error: null }),
    );
    const { getNextPriceItemSortOrder } =
      await import("@/shared/lib/queries/price");
    expect(await getNextPriceItemSortOrder()).toBe(11);
  });

  it("returns 0 silently on PGRST116", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: null,
        error: { code: "PGRST116", message: "no rows" },
      }),
    );
    const { getNextPriceItemSortOrder } =
      await import("@/shared/lib/queries/price");
    expect(await getNextPriceItemSortOrder()).toBe(0);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 0 and logs on other errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: null,
        error: { code: "OTHER", message: "x" },
      }),
    );
    const { getNextPriceItemSortOrder } =
      await import("@/shared/lib/queries/price");
    expect(await getNextPriceItemSortOrder()).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 0 when sort_order null", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { sort_order: null }, error: null }),
    );
    const { getNextPriceItemSortOrder } =
      await import("@/shared/lib/queries/price");
    expect(await getNextPriceItemSortOrder()).toBe(0);
  });
});
