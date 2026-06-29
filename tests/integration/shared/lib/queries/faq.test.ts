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

describe("getActiveFaqs", () => {
  it("returns active FAQs on success", async () => {
    const chain = makePromiseChain({
      data: [{ id: "1", question: "Q", answer: "A", is_active: true }],
      error: null,
    });
    mockFrom.mockImplementation(() => chain);
    const { getActiveFaqs } = await import("@/shared/lib/queries/faq");
    const result = await getActiveFaqs();
    expect(result).toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith("is_active", true);
    expect(chain.order).toHaveBeenCalledWith("display_order", {
      ascending: true,
    });
  });

  it("returns [] on error + logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getActiveFaqs } = await import("@/shared/lib/queries/faq");
    expect(await getActiveFaqs()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getActiveFaqs } = await import("@/shared/lib/queries/faq");
    expect(await getActiveFaqs()).toEqual([]);
  });
});

describe("getAllFaqs", () => {
  it("returns all FAQs on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: [{ id: "1" }, { id: "2" }],
        error: null,
      }),
    );
    const { getAllFaqs } = await import("@/shared/lib/queries/faq");
    expect(await getAllFaqs()).toHaveLength(2);
  });

  it("returns [] on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getAllFaqs } = await import("@/shared/lib/queries/faq");
    expect(await getAllFaqs()).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("handles null data", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getAllFaqs } = await import("@/shared/lib/queries/faq");
    expect(await getAllFaqs()).toEqual([]);
  });
});

describe("getFaqById", () => {
  it("returns single FAQ by id", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: { id: "1", question: "Q", answer: "A" },
        error: null,
      }),
    );
    const { getFaqById } = await import("@/shared/lib/queries/faq");
    const result = await getFaqById("1");
    expect(result).toEqual({ id: "1", question: "Q", answer: "A" });
  });

  it("returns null when error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { getFaqById } = await import("@/shared/lib/queries/faq");
    expect(await getFaqById("1")).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null when data is null without error", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { getFaqById } = await import("@/shared/lib/queries/faq");
    expect(await getFaqById("1")).toBeNull();
  });
});

describe("getNextFaqDisplayOrder", () => {
  it("returns max display_order + 1 on success", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { display_order: 5 }, error: null }),
    );
    const { getNextFaqDisplayOrder } = await import("@/shared/lib/queries/faq");
    expect(await getNextFaqDisplayOrder()).toBe(6);
  });

  it("returns 0 silently on PGRST116 (no rows)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: null,
        error: { code: "PGRST116", message: "no rows" },
      }),
    );
    const { getNextFaqDisplayOrder } = await import("@/shared/lib/queries/faq");
    expect(await getNextFaqDisplayOrder()).toBe(0);
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
    const { getNextFaqDisplayOrder } = await import("@/shared/lib/queries/faq");
    expect(await getNextFaqDisplayOrder()).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 0 when data.display_order is missing (null fallback)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { display_order: null }, error: null }),
    );
    const { getNextFaqDisplayOrder } = await import("@/shared/lib/queries/faq");
    expect(await getNextFaqDisplayOrder()).toBe(0);
  });
});
