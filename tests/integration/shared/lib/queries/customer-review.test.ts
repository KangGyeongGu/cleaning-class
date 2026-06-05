import { describe, it, expect, vi, beforeEach } from "vitest";

interface ChainResult {
  data: unknown;
  error: unknown;
}

function makePromiseChain(result: ChainResult) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) {
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("getAdminCustomerReviews", () => {
  it("returns reviews ordered by created_at desc on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [
          { id: "cr1", rating: 5, comment: "x" },
          { id: "cr2", rating: 4, comment: "y" },
        ],
        error: null,
      }),
    );
    const { getAdminCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    const result = await getAdminCustomerReviews();
    expect(result).toHaveLength(2);
    expect(mockFrom).toHaveBeenCalledWith("customer_reviews");
  });

  it("returns [] on DB error and logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getAdminCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    expect(await getAdminCustomerReviews()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles null data gracefully", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getAdminCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    expect(await getAdminCustomerReviews()).toEqual([]);
  });

  it("supports ascending order when orderAscending=true", async () => {
    const chain = makePromiseChain({ data: [], error: null });
    mockFrom.mockImplementation(() => chain);
    const { getAdminCustomerReviews } =
      await import("@/shared/lib/queries/customer-review");
    await getAdminCustomerReviews(true);
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});
