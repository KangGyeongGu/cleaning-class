import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockUploadImage = vi.hoisted(() =>
  vi.fn().mockResolvedValue("uploaded-path"),
);
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
    "limit",
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
const mockRpc = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
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
const ANOTHER_ID = "00000000-0000-0000-0000-000000000002";

function makeFile(name: string, size: number, type = "image/jpeg"): File {
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

function buildForm(
  overrides: Record<string, FormDataEntryValue> = {},
): FormData {
  const fd = new FormData();
  fd.set("title", "거주청소");
  fd.set("description", "설명");
  fd.set("category", "cleaning");
  fd.set("tags", '["깔끔"]');
  fd.set("sort_order", "0");
  fd.set("is_published", "true");
  fd.set("image_focal_x", "50");
  fd.set("image_focal_y", "50");
  fd.set("image_after_focal_x", "50");
  fd.set("image_after_focal_y", "50");
  fd.set("image", makeFile("before.jpg", 1000));
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockUploadImage.mockResolvedValue("uploaded-path");
  mockRpc.mockResolvedValue({ error: null });
});

describe("createService", () => {
  it("returns success with valid form (no extra images) and inserts mapped fields", async () => {
    const chains: Record<string, unknown>[] = [];
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain({ data: null, error: null });
      chains.push(chain);
      return chain;
    });
    const { createService } = await import("@/shared/actions/service");
    expect((await createService(null, buildForm())).success).toBe(true);
    expect(chains[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "거주청소",
        description: "설명",
        category: "cleaning",
        tags: ["깔끔"],
        sort_order: 0,
        is_published: true,
        image_focal_x: 50,
        image_focal_y: 50,
        image_after_focal_x: 50,
        image_after_focal_y: 50,
        image_path: "uploaded-path",
        image_after_path: "",
        detail_image_path: "",
        detail_image_after_path: "",
      }),
    );
  });

  it("applies fallback defaults when optional fields missing", async () => {
    const chains: Record<string, unknown>[] = [];
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain({ data: null, error: null });
      chains.push(chain);
      return chain;
    });
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.delete("description");
    fd.delete("sort_order");
    fd.delete("image_focal_x");
    fd.delete("image_focal_y");
    fd.delete("image_after_focal_x");
    fd.delete("image_after_focal_y");
    expect((await createService(null, fd)).success).toBe(true);
    expect(chains[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "",
        sort_order: 0,
        image_focal_x: 50,
        image_focal_y: 50,
        image_after_focal_x: 50,
        image_after_focal_y: 50,
        image_after_path: "",
        detail_image_path: "",
        detail_image_after_path: "",
      }),
    );
  });

  it("treats missing tags as empty (Zod fails on min(1))", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.delete("tags");
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("returns success when all 4 images present", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    fd.set("detail_image", makeFile("d-before.jpg", 1000));
    fd.set("detail_image_after", makeFile("d-after.jpg", 1000));
    expect((await createService(null, fd)).success).toBe(true);
  });

  it("falls back to empty tags on invalid JSON", async () => {
    const { createService } = await import("@/shared/actions/service");
    expect(
      (await createService(null, buildForm({ tags: "{bad" }))).success,
    ).toBe(false);
  });

  it("rejects when Zod fails (empty title)", async () => {
    const { createService } = await import("@/shared/actions/service");
    expect((await createService(null, buildForm({ title: "" }))).success).toBe(
      false,
    );
  });

  it("rejects when before image missing", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("rejects before image > 10MB", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("rejects after image > 10MB", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("rejects detail image > 10MB", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("detail_image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("rejects detail after image > 10MB", async () => {
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("detail_image_after", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createService(null, fd)).success).toBe(false);
  });

  it("rolls back uploaded images on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { createService } = await import("@/shared/actions/service");
    expect((await createService(null, buildForm())).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs but tolerates rollback failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    mockDeleteImage.mockRejectedValueOnce(new Error("rollback failed"));
    const { createService } = await import("@/shared/actions/service");
    expect((await createService(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("rolls back already-uploaded paths when a later upload throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUploadImage
      .mockResolvedValueOnce("before-path")
      .mockResolvedValueOnce("after-path")
      .mockRejectedValueOnce(new Error("detail upload fail"));
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    fd.set("detail_image", makeFile("d.jpg", 1000));
    expect((await createService(null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "service-images",
      "before-path",
    );
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "service-images",
      "after-path",
    );
    expect(mockFrom).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("cleans up before-image when after-image exceeds size limit", async () => {
    mockUploadImage.mockResolvedValueOnce("before-path");
    const { createService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await createService(null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "service-images",
      "before-path",
    );
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { createService } = await import("@/shared/actions/service");
    expect((await createService(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updateService", () => {
  function existingChain() {
    return {
      data: {
        image_path: "old.jpg",
        image_after_path: "old-after.jpg",
        detail_image_path: "old-d.jpg",
        detail_image_after_path: "old-da.jpg",
      },
      error: null,
    };
  }

  it("returns success without new images (keep existing)", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? existingChain() : { data: null, error: null },
      ),
    );
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.delete("image");
    fd.set("image", makeFile("empty.jpg", 0));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(true);
  });

  it("applies fallback defaults when optional fields missing", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? existingChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.delete("description");
    fd.delete("sort_order");
    fd.delete("image_focal_x");
    fd.delete("image_focal_y");
    fd.delete("image_after_focal_x");
    fd.delete("image_after_focal_y");
    expect((await updateService(VALID_ID, null, fd)).success).toBe(true);
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "",
        sort_order: 0,
        image_focal_x: 50,
        image_focal_y: 50,
        image_after_focal_x: 50,
        image_after_focal_y: 50,
      }),
    );
  });

  it("uploads new images + deletes old paths on success and injects updated_at", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? existingChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    fd.set("detail_image", makeFile("d.jpg", 1000));
    fd.set("detail_image_after", makeFile("da.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalled();
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "거주청소",
        category: "cleaning",
        tags: ["깔끔"],
        image_path: "uploaded-path",
        image_after_path: "uploaded-path",
        detail_image_path: "uploaded-path",
        detail_image_after_path: "uploaded-path",
        updated_at: expect.any(String),
      }),
    );
    expect(chains[1].eq).toHaveBeenCalledWith("id", VALID_ID);
  });

  it("logs cleanup failure but still returns success", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? existingChain() : { data: null, error: null },
      ),
    );
    mockDeleteImage.mockRejectedValueOnce(new Error("cleanup fail"));
    const { updateService } = await import("@/shared/actions/service");
    expect((await updateService(VALID_ID, null, buildForm())).success).toBe(
      true,
    );
    consoleSpy.mockRestore();
  });

  it("falls back to empty tags on invalid JSON", async () => {
    const { updateService } = await import("@/shared/actions/service");
    expect(
      (await updateService(VALID_ID, null, buildForm({ tags: "{bad" })))
        .success,
    ).toBe(false);
  });

  it("treats missing tags as empty (Zod fails on min(1))", async () => {
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.delete("tags");
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rejects when Zod fails", async () => {
    const { updateService } = await import("@/shared/actions/service");
    expect(
      (await updateService(VALID_ID, null, buildForm({ title: "" }))).success,
    ).toBe(false);
  });

  it("returns failure when fetch existing fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { updateService } = await import("@/shared/actions/service");
    expect((await updateService(VALID_ID, null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("rejects new before image > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rejects new after image > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rejects detail image > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("detail_image", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rejects detail after image > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("detail_image_after", makeFile("big.jpg", 11 * 1024 * 1024));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
  });

  it("rolls back new images on after-image upload failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    mockUploadImage
      .mockResolvedValueOnce("new-before.jpg")
      .mockRejectedValueOnce(new Error("upload fail"));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "service-images",
      "new-before.jpg",
    );
    consoleSpy.mockRestore();
  });

  it("tolerates rollback failure on after-image upload error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    mockUploadImage
      .mockResolvedValueOnce("new-before.jpg")
      .mockRejectedValueOnce(new Error("upload fail"));
    mockDeleteImage.mockRejectedValueOnce(new Error("rollback fail"));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("preserves main image when after-image upload fails without main change", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    mockUploadImage.mockRejectedValueOnce(new Error("upload fail"));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image", makeFile("empty.jpg", 0));
    fd.set("image_after", makeFile("after.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    expect(mockDeleteImage).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("rolls back all newly-uploaded paths when a later upload throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() => makePromiseChain(existingChain()));
    mockUploadImage
      .mockResolvedValueOnce("new-before")
      .mockResolvedValueOnce("new-after")
      .mockRejectedValueOnce(new Error("detail upload fail"));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    fd.set("detail_image", makeFile("d.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "service-images",
      "new-before",
    );
    expect(mockDeleteImage).toHaveBeenCalledWith("service-images", "new-after");
    consoleSpy.mockRestore();
  });

  it("rolls back new images on DB update error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? existingChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("tolerates rollback failure on DB error path", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? existingChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    mockDeleteImage.mockRejectedValueOnce(new Error("rollback fail"));
    const { updateService } = await import("@/shared/actions/service");
    const fd = buildForm();
    fd.set("image_after", makeFile("after.jpg", 1000));
    expect((await updateService(VALID_ID, null, fd)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("rejects an invalid (non-uuid) id before any DB access", async () => {
    const { updateService } = await import("@/shared/actions/service");
    expect((await updateService("not-a-uuid", null, buildForm())).success).toBe(
      false,
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("deleteService", () => {
  it("deletes record + cleans up all images", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? {
              data: {
                image_path: "a.jpg",
                image_after_path: "b.jpg",
                detail_image_path: "c.jpg",
                detail_image_after_path: "d.jpg",
              },
              error: null,
            }
          : { data: null, error: null },
      ),
    );
    const { deleteService } = await import("@/shared/actions/service");
    expect((await deleteService(VALID_ID)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledTimes(4);
  });

  it("tolerates image cleanup failure on success", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? {
              data: {
                image_path: "a.jpg",
                image_after_path: "",
                detail_image_path: "",
                detail_image_after_path: "",
              },
              error: null,
            }
          : { data: null, error: null },
      ),
    );
    mockDeleteImage.mockRejectedValueOnce(new Error("cleanup fail"));
    const { deleteService } = await import("@/shared/actions/service");
    expect((await deleteService(VALID_ID)).success).toBe(true);
    consoleSpy.mockRestore();
  });

  it("returns failure when fetch existing fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { deleteService } = await import("@/shared/actions/service");
    expect((await deleteService(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when delete fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? {
              data: {
                image_path: "a.jpg",
                image_after_path: "",
                detail_image_path: "",
                detail_image_after_path: "",
              },
              error: null,
            }
          : { data: null, error: { message: "rls" } },
      ),
    );
    const { deleteService } = await import("@/shared/actions/service");
    expect((await deleteService(VALID_ID)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("rejects an invalid (non-uuid) id before any DB access", async () => {
    const { deleteService } = await import("@/shared/actions/service");
    expect((await deleteService("not-a-uuid")).success).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("toggleServicePublish", () => {
  it("returns success on DB ok (publish=true)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { toggleServicePublish } = await import("@/shared/actions/service");
    expect((await toggleServicePublish(VALID_ID, true)).success).toBe(true);
  });

  it("returns success on DB ok (publish=false)", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { toggleServicePublish } = await import("@/shared/actions/service");
    const r = await toggleServicePublish(VALID_ID, false);
    expect(r.success).toBe(true);
    expect("message" in r ? r.message : undefined).toContain("비공개");
  });

  it("returns failure on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { toggleServicePublish } = await import("@/shared/actions/service");
    expect((await toggleServicePublish(VALID_ID, false)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("rejects an invalid (non-uuid) id before any DB access", async () => {
    const { toggleServicePublish } = await import("@/shared/actions/service");
    expect((await toggleServicePublish("not-a-uuid", true)).success).toBe(
      false,
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("reorderServices", () => {
  it("calls reorder_services RPC with positional order items", async () => {
    const { reorderServices } = await import("@/shared/actions/service");
    expect((await reorderServices([VALID_ID, ANOTHER_ID])).success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("reorder_services", {
      items: [
        { id: VALID_ID, order: 0 },
        { id: ANOTHER_ID, order: 1 },
      ],
    });
  });

  it("rejects malformed UUID before touching the DB", async () => {
    const { reorderServices } = await import("@/shared/actions/service");
    expect((await reorderServices(["not-a-uuid"])).success).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects more than MAX_REORDER_ITEMS", async () => {
    const ids = Array.from({ length: 101 }, () => VALID_ID);
    const { reorderServices } = await import("@/shared/actions/service");
    expect((await reorderServices(ids)).success).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns failure when RPC errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRpc.mockResolvedValueOnce({ error: { message: "x" } });
    const { reorderServices } = await import("@/shared/actions/service");
    expect((await reorderServices([VALID_ID])).success).toBe(false);
    consoleSpy.mockRestore();
  });
});
