import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockInsert = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockRpc = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
  })),
);
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
);

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

const VALID_ID = "00000000-0000-0000-0000-000000000001";
const ANOTHER_ID = "00000000-0000-0000-0000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockEq.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
});

function buildForm(
  overrides: Partial<Record<string, FormDataEntryValue>> = {},
): FormData {
  const fd = new FormData();
  fd.set("question", "결제 방법은?");
  fd.set("answer", "현금 또는 계좌이체");
  fd.set("display_order", "0");
  fd.set("is_active", "true");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, String(v));
  }
  return fd;
}

describe("createFaq", () => {
  it("returns success with valid form", async () => {
    const { createFaq } = await import("@/shared/actions/faq");
    const result = await createFaq(null, buildForm());
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "결제 방법은?",
        answer: "현금 또는 계좌이체",
        display_order: 0,
        is_active: true,
      }),
    );
  });

  it("rejects empty question (Zod)", async () => {
    const { createFaq } = await import("@/shared/actions/faq");
    const result = await createFaq(null, buildForm({ question: "" }));
    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects empty-string display_order (parsed as NaN)", async () => {
    const { createFaq } = await import("@/shared/actions/faq");
    const result = await createFaq(null, buildForm({ display_order: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects missing display_order entirely", async () => {
    const fd = buildForm();
    fd.delete("display_order");
    const { createFaq } = await import("@/shared/actions/faq");
    const result = await createFaq(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockResolvedValueOnce({ error: { message: "x" } });
    const { createFaq } = await import("@/shared/actions/faq");
    expect((await createFaq(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when getUser throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("unauth"));
    const { createFaq } = await import("@/shared/actions/faq");
    expect((await createFaq(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updateFaq", () => {
  it("returns success on valid id + form and injects updated_at", async () => {
    const { updateFaq } = await import("@/shared/actions/faq");
    expect((await updateFaq(VALID_ID, null, buildForm())).success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "결제 방법은?",
        answer: "현금 또는 계좌이체",
        display_order: 0,
        is_active: true,
        updated_at: expect.any(String),
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", VALID_ID);
  });

  it("rejects invalid UUID", async () => {
    const { updateFaq } = await import("@/shared/actions/faq");
    expect((await updateFaq("bad", null, buildForm())).success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects when Zod fails", async () => {
    const { updateFaq } = await import("@/shared/actions/faq");
    expect(
      (await updateFaq(VALID_ID, null, buildForm({ question: "" }))).success,
    ).toBe(false);
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "x" } });
    const { updateFaq } = await import("@/shared/actions/faq");
    expect((await updateFaq(VALID_ID, null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("deleteFaq", () => {
  it("returns success on valid id", async () => {
    const { deleteFaq } = await import("@/shared/actions/faq");
    expect((await deleteFaq(VALID_ID)).success).toBe(true);
  });

  it("rejects invalid UUID", async () => {
    const { deleteFaq } = await import("@/shared/actions/faq");
    expect((await deleteFaq("x")).success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "x" } });
    const { deleteFaq } = await import("@/shared/actions/faq");
    expect((await deleteFaq(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("toggleFaqActive", () => {
  it("returns success on valid input (active=true)", async () => {
    const { toggleFaqActive } = await import("@/shared/actions/faq");
    expect((await toggleFaqActive(VALID_ID, true)).success).toBe(true);
  });

  it("returns success message for inactive case (active=false)", async () => {
    const { toggleFaqActive } = await import("@/shared/actions/faq");
    const r = await toggleFaqActive(VALID_ID, false);
    expect(r.success).toBe(true);
    expect("message" in r ? r.message : undefined).toContain("비활성화");
  });

  it("rejects invalid UUID", async () => {
    const { toggleFaqActive } = await import("@/shared/actions/faq");
    expect((await toggleFaqActive("bad", false)).success).toBe(false);
  });

  it("rejects non-boolean (defensive)", async () => {
    const { toggleFaqActive } = await import("@/shared/actions/faq");
    expect(
      (await toggleFaqActive(VALID_ID, "true" as unknown as boolean)).success,
    ).toBe(false);
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "x" } });
    const { toggleFaqActive } = await import("@/shared/actions/faq");
    expect((await toggleFaqActive(VALID_ID, true)).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("reorderFaqs", () => {
  it("returns success for empty array (no-op)", async () => {
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect((await reorderFaqs([])).success).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects > MAX_REORDER_ITEMS", async () => {
    const items = Array.from({ length: 101 }, (_, i) => ({
      id: VALID_ID,
      display_order: i,
    }));
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect((await reorderFaqs(items)).success).toBe(false);
  });

  it("rejects malformed UUID", async () => {
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect((await reorderFaqs([{ id: "x", display_order: 0 }])).success).toBe(
      false,
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects negative display_order", async () => {
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect(
      (await reorderFaqs([{ id: VALID_ID, display_order: -1 }])).success,
    ).toBe(false);
  });

  it("calls reorder_faqs RPC with order-mapped items", async () => {
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect(
      (
        await reorderFaqs([
          { id: VALID_ID, display_order: 0 },
          { id: ANOTHER_ID, display_order: 1 },
        ])
      ).success,
    ).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("reorder_faqs", {
      items: [
        { id: VALID_ID, order: 0 },
        { id: ANOTHER_ID, order: 1 },
      ],
    });
  });

  it("returns failure when RPC errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRpc.mockResolvedValueOnce({ error: { message: "x" } });
    const { reorderFaqs } = await import("@/shared/actions/faq");
    expect(
      (
        await reorderFaqs([
          { id: VALID_ID, display_order: 0 },
          { id: ANOTHER_ID, display_order: 1 },
        ])
      ).success,
    ).toBe(false);
    consoleSpy.mockRestore();
  });
});
