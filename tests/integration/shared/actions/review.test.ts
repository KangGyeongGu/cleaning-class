import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockUploadImage = vi.hoisted(() => vi.fn());
const mockDeleteImage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

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
    "update",
    "insert",
    "delete",
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

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));
vi.mock("@/shared/lib/supabase/storage-server", () => ({
  uploadImage: mockUploadImage,
  deleteImage: mockDeleteImage,
}));

const VALID_ID = "00000000-0000-0000-0000-000000000001";

function makeFile(name: string, size: number, type = "image/jpeg"): File {
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

function buildForm(
  overrides: Record<string, FormDataEntryValue> = {},
): FormData {
  const fd = new FormData();
  fd.set("title", "테스트 후기");
  fd.set("summary", "후기 요약");
  fd.set("tags", '["거주청소"]');
  fd.set("link_url", "https://blog.example.com/1");
  fd.set("is_published", "true");
  fd.set("image", makeFile("photo.jpg", 1000));
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockUploadImage.mockResolvedValue("path/uploaded.jpg");
});

describe("createReview", () => {
  it("returns success when all checks pass", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { createReview } = await import("@/shared/actions/review");
    const result = await createReview(null, buildForm());
    expect(result.success).toBe(true);
    expect(mockUploadImage).toHaveBeenCalled();
  });

  it("applies link_url fallback when missing", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { createReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.delete("link_url");
    expect((await createReview(null, fd)).success).toBe(true);
  });

  it("rejects invalid JSON in tags", async () => {
    const { createReview } = await import("@/shared/actions/review");
    expect(
      (await createReview(null, buildForm({ tags: "not-json{" }))).success,
    ).toBe(false);
  });

  it("treats missing tags as empty array (rejects on Zod min(1))", async () => {
    const { createReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.delete("tags");
    expect((await createReview(null, fd)).success).toBe(false);
  });

  it("rejects when Zod fails (empty title)", async () => {
    const { createReview } = await import("@/shared/actions/review");
    expect((await createReview(null, buildForm({ title: "" }))).success).toBe(
      false,
    );
  });

  it("rejects when image missing", async () => {
    const { createReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await createReview(null, fd)).success).toBe(false);
  });

  it("rejects image larger than 10MB", async () => {
    const { createReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.set("image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createReview(null, fd)).success).toBe(false);
  });

  it("rolls back uploaded image on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { createReview } = await import("@/shared/actions/review");
    expect((await createReview(null, buildForm())).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "review-images",
      "path/uploaded.jpg",
    );
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("unauth"));
    const { createReview } = await import("@/shared/actions/review");
    expect((await createReview(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updateReview", () => {
  it("applies link_url fallback when missing on update", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "old.jpg" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.delete("link_url");
    fd.delete("image");
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await updateReview(VALID_ID, null, fd)).success).toBe(true);
  });

  it("returns success when no new image provided (keep existing)", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "old.jpg" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.delete("image");
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await updateReview(VALID_ID, null, fd)).success).toBe(true);
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  it("uploads new image + deletes old on successful update", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "old.jpg" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateReview } = await import("@/shared/actions/review");
    expect((await updateReview(VALID_ID, null, buildForm())).success).toBe(
      true,
    );
    expect(mockUploadImage).toHaveBeenCalled();
    expect(mockDeleteImage).toHaveBeenCalledWith("review-images", "old.jpg");
  });

  it("rejects invalid JSON in tags", async () => {
    const { updateReview } = await import("@/shared/actions/review");
    expect(
      (await updateReview(VALID_ID, null, buildForm({ tags: "{bad" }))).success,
    ).toBe(false);
  });

  it("treats missing tags as empty array (rejects on Zod min(1))", async () => {
    const { updateReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.delete("tags");
    expect((await updateReview(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rejects when Zod fails", async () => {
    const { updateReview } = await import("@/shared/actions/review");
    expect(
      (await updateReview(VALID_ID, null, buildForm({ title: "" }))).success,
    ).toBe(false);
  });

  it("returns failure when fetch existing fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "no row" } }),
    );
    const { updateReview } = await import("@/shared/actions/review");
    expect((await updateReview(VALID_ID, null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("rejects new image > 10MB", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: { image_path: "old.jpg" }, error: null }),
    );
    const { updateReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.set("image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await updateReview(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rolls back new image when DB update fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "old.jpg" }, error: null }
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateReview } = await import("@/shared/actions/review");
    expect((await updateReview(VALID_ID, null, buildForm())).success).toBe(
      false,
    );
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "review-images",
      "path/uploaded.jpg",
    );
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateReview } = await import("@/shared/actions/review");
    expect((await updateReview(VALID_ID, null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("preserves existing image when update fails without new image", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "old.jpg" }, error: null }
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateReview } = await import("@/shared/actions/review");
    const fd = buildForm();
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await updateReview(VALID_ID, null, fd)).success).toBe(false);
    expect(mockDeleteImage).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("deleteReview", () => {
  it("deletes record + deletes existing image", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "to-delete.jpg" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { deleteReview } = await import("@/shared/actions/review");
    expect((await deleteReview(VALID_ID)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "review-images",
      "to-delete.jpg",
    );
  });

  it("returns failure when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "no" } }),
    );
    const { deleteReview } = await import("@/shared/actions/review");
    expect((await deleteReview(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when delete fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "x.jpg" }, error: null }
          : { data: null, error: { message: "rls" } },
      ),
    );
    const { deleteReview } = await import("@/shared/actions/review");
    expect((await deleteReview(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("skips deleteImage when image_path empty", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { image_path: "" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { deleteReview } = await import("@/shared/actions/review");
    expect((await deleteReview(VALID_ID)).success).toBe(true);
    expect(mockDeleteImage).not.toHaveBeenCalled();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { deleteReview } = await import("@/shared/actions/review");
    expect((await deleteReview(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("toggleReviewPublish", () => {
  it("returns success on DB ok (publish=true)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { toggleReviewPublish } = await import("@/shared/actions/review");
    expect((await toggleReviewPublish(VALID_ID, true)).success).toBe(true);
  });

  it("returns success on DB ok (publish=false)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { toggleReviewPublish } = await import("@/shared/actions/review");
    const r = await toggleReviewPublish(VALID_ID, false);
    expect(r.success).toBe(true);
    expect(r.message).toContain("비공개");
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { toggleReviewPublish } = await import("@/shared/actions/review");
    expect((await toggleReviewPublish(VALID_ID, false)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { toggleReviewPublish } = await import("@/shared/actions/review");
    expect((await toggleReviewPublish(VALID_ID, true)).success).toBe(false);
    consoleSpy.mockRestore();
  });
});
