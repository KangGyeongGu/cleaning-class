import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockInsert = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
  })),
);
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom })),
);

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/shared/lib/supabase/auth", () => ({
  getUser: mockGetUser,
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

const VALID_ID = "00000000-0000-0000-0000-000000000001";
const ANOTHER_ID = "00000000-0000-0000-0000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ id: "user-1", email: "admin@x.com" });
  mockEq.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
});

describe("togglePriceItemPublished", () => {
  it("returns success when id valid + user authenticated + DB succeeds", async () => {
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    const result = await togglePriceItemPublished(VALID_ID, true);

    expect(result.success).toBe(true);
    expect(mockGetUser).toHaveBeenCalledOnce();
    expect(mockFrom).toHaveBeenCalledWith("price_items");
  });

  it("rejects malformed UUID before touching DB", async () => {
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    const result = await togglePriceItemPublished("not-a-uuid", true);

    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns failure when getUser throws (unauthenticated)", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("Unauthenticated"));
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    const result = await togglePriceItemPublished(VALID_ID, true);

    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns failure when DB update returns error", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "RLS denied" } });
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    const result = await togglePriceItemPublished(VALID_ID, true);

    expect(result.success).toBe(false);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates /price and /admin/price on success", async () => {
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    await togglePriceItemPublished(VALID_ID, false);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/price");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/price");
  });

  it("rejects non-boolean isPublished (defensive)", async () => {
    const { togglePriceItemPublished } = await import("@/shared/actions/price");
    const result = await togglePriceItemPublished(
      VALID_ID,
      "true" as unknown as boolean,
    );
    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("deletePriceItem", () => {
  it("returns success on valid id + DB ok", async () => {
    const { deletePriceItem } = await import("@/shared/actions/price");
    const result = await deletePriceItem(VALID_ID);

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("rejects malformed UUID", async () => {
    const { deletePriceItem } = await import("@/shared/actions/price");
    const result = await deletePriceItem("bad-id");

    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("propagates Supabase error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "FK violation" } });
    const { deletePriceItem } = await import("@/shared/actions/price");
    const result = await deletePriceItem(VALID_ID);

    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { deletePriceItem } = await import("@/shared/actions/price");
    expect((await deletePriceItem(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("createPriceItem", () => {
  function buildFormData(
    overrides: Partial<Record<string, FormDataEntryValue>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("name", "테스트 항목");
    fd.set("price_won", "200000");
    fd.set("sort_order", "0");
    fd.set("is_published", "true");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, String(v));
    }
    return fd;
  }

  it("returns success with valid form", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    const result = await createPriceItem(null, buildFormData());

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("treats is_variable=true as price_won=null", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    const fd = buildFormData({ is_variable: "true", price_won: "" });
    const result = await createPriceItem(null, fd);

    expect(result.success).toBe(true);
    const insertedRow = mockInsert.mock.calls[0]?.[0];
    expect(insertedRow.price_won).toBeNull();
  });

  it("rejects empty name (Zod validation error)", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    const result = await createPriceItem(null, buildFormData({ name: "" }));

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects non-integer price_won", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    const result = await createPriceItem(
      null,
      buildFormData({ price_won: "abc" }),
    );

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects missing price_won (returns NaN)", async () => {
    const fd = buildFormData();
    fd.delete("price_won");
    const { createPriceItem } = await import("@/shared/actions/price");
    expect((await createPriceItem(null, fd)).success).toBe(false);
  });

  it("rejects empty-string price_won (returns NaN)", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    expect(
      (await createPriceItem(null, buildFormData({ price_won: "" }))).success,
    ).toBe(false);
  });

  it("rejects missing sort_order (returns NaN)", async () => {
    const fd = buildFormData();
    fd.delete("sort_order");
    const { createPriceItem } = await import("@/shared/actions/price");
    expect((await createPriceItem(null, fd)).success).toBe(false);
  });

  it("rejects empty-string sort_order (returns NaN)", async () => {
    const { createPriceItem } = await import("@/shared/actions/price");
    expect(
      (await createPriceItem(null, buildFormData({ sort_order: "" }))).success,
    ).toBe(false);
  });

  it("returns failure when DB insert errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockResolvedValueOnce({ error: { message: "duplicate" } });
    const { createPriceItem } = await import("@/shared/actions/price");
    const result = await createPriceItem(null, buildFormData());

    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception (getUser throws)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("unauth"));
    const { createPriceItem } = await import("@/shared/actions/price");
    expect((await createPriceItem(null, buildFormData())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updatePriceItem", () => {
  function buildFormData(
    overrides: Partial<Record<string, FormDataEntryValue>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("name", "수정 항목");
    fd.set("price_won", "300000");
    fd.set("sort_order", "0");
    fd.set("is_published", "true");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, String(v));
    }
    return fd;
  }

  it("returns success on valid id + form", async () => {
    const { updatePriceItem } = await import("@/shared/actions/price");
    expect(
      (await updatePriceItem(VALID_ID, null, buildFormData())).success,
    ).toBe(true);
  });

  it("rejects invalid UUID", async () => {
    const { updatePriceItem } = await import("@/shared/actions/price");
    expect((await updatePriceItem("bad", null, buildFormData())).success).toBe(
      false,
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects when Zod fails (empty name)", async () => {
    const { updatePriceItem } = await import("@/shared/actions/price");
    expect(
      (await updatePriceItem(VALID_ID, null, buildFormData({ name: "" })))
        .success,
    ).toBe(false);
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "x" } });
    const { updatePriceItem } = await import("@/shared/actions/price");
    expect(
      (await updatePriceItem(VALID_ID, null, buildFormData())).success,
    ).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updatePriceItem } = await import("@/shared/actions/price");
    expect(
      (await updatePriceItem(VALID_ID, null, buildFormData())).success,
    ).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("reorderPriceItems", () => {
  it("returns success for empty array (no-op)", async () => {
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems([]);

    expect(result.success).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects array exceeding MAX_REORDER_ITEMS", async () => {
    const items = Array.from({ length: 101 }, (_, i) => ({
      id: VALID_ID,
      sort_order: i,
    }));
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems(items);

    expect(result.success).toBe(false);
  });

  it("rejects items with malformed UUID", async () => {
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems([{ id: "bad", sort_order: 0 }]);

    expect(result.success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects items with negative sort_order", async () => {
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems([{ id: VALID_ID, sort_order: -1 }]);

    expect(result.success).toBe(false);
  });

  it("returns success on valid batch update", async () => {
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems([
      { id: VALID_ID, sort_order: 0 },
      { id: ANOTHER_ID, sort_order: 1 },
    ]);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("returns failure when any batch row errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "row 2 failed" } });
    const { reorderPriceItems } = await import("@/shared/actions/price");
    const result = await reorderPriceItems([
      { id: VALID_ID, sort_order: 0 },
      { id: ANOTHER_ID, sort_order: 1 },
    ]);

    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { reorderPriceItems } = await import("@/shared/actions/price");
    expect(
      (await reorderPriceItems([{ id: VALID_ID, sort_order: 0 }])).success,
    ).toBe(false);
    consoleSpy.mockRestore();
  });
});
