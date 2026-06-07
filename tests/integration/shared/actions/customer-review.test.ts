import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockDelete = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({ update: mockUpdate, delete: mockDelete })),
);
const mockRpc = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom })),
);
const mockCreateStaticClient = vi.hoisted(() =>
  vi.fn(() => ({ rpc: mockRpc })),
);

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@/shared/lib/supabase/static", () => ({
  createStaticClient: mockCreateStaticClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockEq.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
});

describe("deleteCustomerReview", () => {
  it("returns success on valid id + DB ok", async () => {
    const { deleteCustomerReview } =
      await import("@/shared/actions/customer-review");
    const result = await deleteCustomerReview("cr1");
    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/customer-reviews");
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "RLS" } });
    const { deleteCustomerReview } =
      await import("@/shared/actions/customer-review");
    const result = await deleteCustomerReview("cr1");
    expect(result.success).toBe(false);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns failure when getUser throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("unauth"));
    const { deleteCustomerReview } =
      await import("@/shared/actions/customer-review");
    const result = await deleteCustomerReview("cr1");
    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("toggleCustomerReviewPublish", () => {
  it("returns success when toggle succeeds", async () => {
    const { toggleCustomerReviewPublish } =
      await import("@/shared/actions/customer-review");
    const result = await toggleCustomerReviewPublish("cr1", true);
    expect(result.success).toBe(true);
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockResolvedValueOnce({ error: { message: "x" } });
    const { toggleCustomerReviewPublish } =
      await import("@/shared/actions/customer-review");
    expect((await toggleCustomerReviewPublish("cr1", false)).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("returns failure on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { toggleCustomerReviewPublish } =
      await import("@/shared/actions/customer-review");
    expect((await toggleCustomerReviewPublish("cr1", true)).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });
});

describe("submitPublicReview", () => {
  function buildForm(
    overrides: Partial<Record<string, FormDataEntryValue>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("rating", "5");
    fd.set("comment", "좋아요");
    fd.set("service_type", "거주청소");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, String(v));
    }
    return fd;
  }

  it("returns success on valid form + RPC ok", async () => {
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    const result = await submitPublicReview(null, buildForm());
    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith(
      "submit_public_review",
      expect.objectContaining({ p_rating: 5 }),
    );
  });

  it("returns errors when Zod fails (rating out of range)", async () => {
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    const result = await submitPublicReview(null, buildForm({ rating: "10" }));
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns errors when comment empty", async () => {
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    const result = await submitPublicReview(null, buildForm({ comment: "" }));
    expect(result.success).toBe(false);
  });

  it("returns failure when RPC errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRpc.mockResolvedValueOnce({ error: { message: "denied" } });
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    const result = await submitPublicReview(null, buildForm());
    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("handles missing service_type (optional)", async () => {
    const fd = new FormData();
    fd.set("rating", "5");
    fd.set("comment", "x");
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    const result = await submitPublicReview(null, fd);
    expect(result.success).toBe(true);
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateStaticClient.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { submitPublicReview } =
      await import("@/shared/actions/customer-review");
    expect((await submitPublicReview(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});
