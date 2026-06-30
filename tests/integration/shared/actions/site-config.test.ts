import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue({ id: "u1" });
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

  it("revalidates field-specific extra paths (faq) and writes faq_description column", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateFaqDescription } =
      await import("@/shared/actions/site-config");
    expect((await updateFaqDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/help");
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        faq_description: "d",
        updated_at: expect.any(String),
      }),
    );
    expect(chains[1].eq).toHaveBeenCalledWith("id", "cfg-1");
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

  it("updatePriceDescription succeeds, writes price_description column and revalidates price path", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updatePriceDescription } =
      await import("@/shared/actions/site-config");
    expect((await updatePriceDescription("d")).success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/price");
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        price_description: "d",
        updated_at: expect.any(String),
      }),
    );
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

  it("returns success when valid and writes mapped fields + updated_at", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0 ? siteConfigChain() : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateSiteConfig } = await import("@/shared/actions/site-config");
    expect((await updateSiteConfig(null, buildForm())).success).toBe(true);
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        business_name: "청소클라쓰",
        representative: "홍길동",
        phone: "010-1234-5678",
        email: "a@b.com",
        site_url: "https://example.com",
        address_region: "전북",
        address_locality: "전주시",
        updated_at: expect.any(String),
      }),
    );
    expect(chains[1].eq).toHaveBeenCalledWith("id", "cfg-1");
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

  it("returns success on valid input and writes moving_* fields + updated_at", async () => {
    const chains: Record<string, unknown>[] = [];
    let call = 0;
    mockFrom.mockImplementation(() => {
      const chain = makePromiseChain(
        call++ === 0
          ? { data: { id: "cfg-1" }, error: null }
          : { data: null, error: null },
      );
      chains.push(chain);
      return chain;
    });
    const { updateMovingSiteConfig } =
      await import("@/shared/actions/site-config");
    expect((await updateMovingSiteConfig(null, buildForm())).success).toBe(
      true,
    );
    expect(chains[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        moving_representative: "이사남",
        moving_phone: "010-9999-8888",
        moving_business_registration_number: "000-11-22222",
        moving_address: "전주시",
        updated_at: expect.any(String),
      }),
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
