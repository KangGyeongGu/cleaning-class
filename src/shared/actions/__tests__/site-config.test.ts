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

describe("updateCustomerReviewDescription / updateFaqDescription / updateReviewDescription / updateServiceDescription", () => {
  it("returns success when DB update succeeds", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateCustomerReviewDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateCustomerReviewDescription("d")).success).toBe(true);
  });

  it("revalidates field-specific extra paths (faq)", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/help");
  });

  it("revalidates review_description extra paths", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateReviewDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateReviewDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/reviews");
  });

  it("revalidates service_description extra paths", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateServiceDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateServiceDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/services");
  });

  it("updatePriceDescription succeeds and revalidates price path", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updatePriceDescription } =
      await import("@/shared/actions/site-config");
    expect((await updatePriceDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/price");
  });

  it("returns failure when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when fetch returns null without error", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(false);
  });

  it("returns failure when update fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updateSiteConfig", () => {
  function siteConfigChain() {
    return {
      data: {
        id: "cfg-1",
        site_url: "https://example.com",
        address_region: "전북",
        address_locality: "전주시",
      },
      error: null,
    };
  }

  function buildForm(
    overrides: Partial<Record<string, FormDataEntryValue>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("business_name", "청소클라쓰");
    fd.set("representative", "홍길동");
    fd.set("business_registration_number", "000-00-00000");
    fd.set("phone", "010-1234-5678");
    fd.set("email", "a@b.com");
    fd.set("blog_url", "");
    fd.set("instagram_url", "");
    fd.set("daangn_url", "");
    fd.set("description", "");
    fd.set("address", "전주시");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, String(v));
    }
    return fd;
  }

  it("returns success when valid", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? siteConfigChain() : { data: null, error: null },
      ),
    );
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(true);
  });

  it("applies fallback empty strings when optional fields missing", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? siteConfigChain() : { data: null, error: null },
      ),
    );
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    const fd = buildForm();
    fd.delete("representative");
    fd.delete("business_registration_number");
    fd.delete("address");
    expect((await updateSiteConfig(null, fd)).success).toBe(true);
  });

  it("returns failure when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure when fetch returns null without error", async () => {
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: null }),
    );
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(false);
  });

  it("rejects when Zod fails (bad phone)", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(siteConfigChain()));
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect(
      (await updateSiteConfig(null, buildForm({ phone: "bad" }))).success,
    ).toBe(false);
  });

  it("returns failure when update errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? siteConfigChain()
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
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

  it("uploads new image + replaces existing", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      ),
    );
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    const fd = buildForm({ hero_image: makeFile("new.jpg", 1000) });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith("hero-images", "old-1.jpg");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    const fd = buildForm({ delete_hero_image: "true" });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).not.toHaveBeenCalled();
  });

  it("uses slot 2 for hero_image_path_2", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      ),
    );
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    const fd = buildForm({ slot: "2", hero_image: makeFile("new.jpg", 1000) });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
  });

  it("deletes hero image when delete_hero_image=true and path exists", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0 ? heroFetchChain() : { data: null, error: null },
      ),
    );
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    const fd = buildForm({ delete_hero_image: "true" });
    expect((await updateHeroImage(null, fd)).success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalled();
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
  });

  it("rejects file > 10MB", async () => {
    mockFrom.mockImplementation(() => makePromiseChain(heroFetchChain()));
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
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
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateHeroImage } = await import("@/shared/actions/site-config");
    expect((await updateHeroImage(null, buildForm())).success).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("updateMovingSiteConfig", () => {
  function buildForm(
    overrides: Partial<Record<string, FormDataEntryValue>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("moving_representative", "이사남");
    fd.set("moving_phone", "010-9999-8888");
    fd.set("moving_business_registration_number", "000-11-22222");
    fd.set("moving_address", "전주시");
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, String(v));
    }
    return fd;
  }

  it("returns success on valid input", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, buildForm())).success).toBe(
      true,
    );
  });

  it("applies fallback empty string when fields missing", async () => {
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      ),
    );
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, new FormData())).success).toBe(
      true,
    );
  });

  it("rejects when Zod fails (bad phone)", async () => {
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect(
      (await updateMovingSiteConfig(null, buildForm({ moving_phone: "bad" })))
        .success,
    ).toBe(false);
  });

  it("returns failure when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockImplementation(() =>
      makePromiseChain({ data: null, error: { message: "x" } }),
    );
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("returns failure when update errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    mockFrom.mockImplementation(() =>
      makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: { message: "x" } },
      ),
    );
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });

  it("returns failure on outer exception", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockRejectedValueOnce(new Error("x"));
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, buildForm())).success).toBe(
      false,
    );
    consoleSpy.mockRestore();
  });
});
