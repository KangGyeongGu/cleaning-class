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
  for (const method of ["select", "eq", "update", "limit", "single"]) {
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

function makeFile(name: string, size: number, type = "image/jpeg"): File {
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
  mockUploadImage.mockResolvedValue("uploaded-path");
  mockDeleteImage.mockResolvedValue(undefined);
});

describe("updateHeroImage", () => {
  function heroFetchChain() {
    return {
      data: {
        id: "cfg-1",
        hero_image_path: "old-1.jpg",
        hero_image_path_2: "old-2.jpg",
      },
      error: null,
    };
  }

  function buildForm(
    overrides: Record<string, FormDataEntryValue> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("slot", "1");
    fd.set("focal_x", "50");
    fd.set("focal_y", "50");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, v);
    }
    return fd;
  }

  it("uploads new image + replaces existing (slot 1 → hero_image_path column)", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ hero_image: makeFile("new.jpg", 1000) });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith("hero-images", "old-1.jpg");
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        hero_image_path: "uploaded-path",
        hero_image_focal_x: 50,
        hero_image_focal_y: 50,
        updated_at: expect.any(String),
      }),
    );
  });

  it("uploads first image without deleting when no existing path", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? {
              data: {
                id: "cfg-1",
                hero_image_path: "",
                hero_image_path_2: "",
              },
              error: null,
            }
          : { data: null, error: null },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ hero_image: makeFile("first.jpg", 1000) });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).not.toHaveBeenCalled();
  });

  it("skips deleteImage on delete request when path already empty", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? {
              data: {
                id: "cfg-1",
                hero_image_path: "",
                hero_image_path_2: "",
              },
              error: null,
            }
          : { data: null, error: null },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ delete_hero_image: "true" });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).not.toHaveBeenCalled();
  });

  it("uses slot 2 → hero_image_path_2 / focal_*_2 columns", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({
      slot: "2",
      focal_x: "30",
      focal_y: "70",
      hero_image: makeFile("new.jpg", 1000),
    });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith("hero-images", "old-2.jpg");
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        hero_image_path_2: "uploaded-path",
        hero_image_focal_x_2: 30,
        hero_image_focal_y_2: 70,
        updated_at: expect.any(String),
      }),
    );
  });

  it("deletes hero image when delete_hero_image=true and path exists (clears column)", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ delete_hero_image: "true" });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith("hero-images", "old-1.jpg");
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        hero_image_path: "",
        hero_image_focal_x: 50,
        hero_image_focal_y: 50,
        updated_at: expect.any(String),
      }),
    );
  });

  it("returns failure on delete DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? heroFetchChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ delete_hero_image: "true" });
    expect((await updateHeroImage(null, fd)).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("uses default focal when focal_x/y missing", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = new FormData();
    fd.set("slot", "1");
    fd.set("hero_image", makeFile("new.jpg", 1000));
    expect((await updateHeroImage(null, fd)).success).toBe(true);
  });

  it("updates focal only when file empty and currentPath exists", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ hero_image: makeFile("e.jpg", 0) });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
  });

  it("returns failure when focal update fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? heroFetchChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when no file and no currentPath", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({
        data: {
          id: "cfg-1",
          hero_image_path: null,
          hero_image_path_2: null,
        },
        error: null,
      }),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
  });

  it("rejects file > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(heroFetchChain()));
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ hero_image: makeFile("big.jpg", 11 * 1024 * 1024) });
    expect((await updateHeroImage(null, fd)).success).toBe(false);
  });

  it("rolls back uploaded image on DB error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? heroFetchChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    const fd = buildForm({ hero_image: makeFile("new.jpg", 1000) });
    expect((await updateHeroImage(null, fd)).success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith(
      "hero-images",
      "uploaded-path",
    );
    consoleSpy.mockRestore();
  });

  it("returns failure on fetch error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateHeroImage } =
      await import("@/shared/actions/site-config-hero");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});
