import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeroAsset } from "@/shared/lib/domain/hero-images";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mocks.getUser }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from, rpc: mocks.rpc })),
}));
vi.mock("@/shared/lib/supabase/storage-server", () => ({
  uploadImage: mocks.upload,
  deleteImage: mocks.remove,
}));
import { updateHeroImage } from "@/shared/actions/site-config-hero";
const asset: HeroAsset = {
  displayPath: "result.webp",
  focalX: 50,
  focalY: 50,
};
function config(
  images: unknown = {
    pc: { left: asset, right: null },
    mobile: { left: null, right: null },
  },
) {
  return {
    id: "config",
    hero_images: images,
    hero_image_path: null,
    hero_image_path_2: null,
  };
}
function form(expected: HeroAsset | null = asset) {
  const data = new FormData();
  data.set("device", "pc");
  data.set("side", "left");
  data.set("expected", JSON.stringify(expected));
  data.set(
    "hero_image",
    new File(["result"], "cropped.webp", { type: "image/webp" }),
  );
  return data;
}
function fetchResult(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "limit", "eq"])
    chain[method] = vi.fn(() => chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  mocks.from.mockReturnValue(chain);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ id: "admin" });
  mocks.upload.mockResolvedValue("new-result.webp");
  mocks.remove.mockResolvedValue(undefined);
  mocks.rpc.mockResolvedValue({ data: ["result.webp"], error: null });
  fetchResult(config());
});

describe("hero variant save", () => {
  it("uploads cropped result and atomically updates only selected target", async () => {
    const data = form();
    data.set("device", "mobile");
    data.set("side", "right");
    fetchResult(
      config({
        pc: { left: null, right: null },
        mobile: { left: null, right: asset },
      }),
    );
    expect(await updateHeroImage(null, data)).toEqual({ success: true });
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("update_hero_image_variant", {
      p_id: "config",
      p_device: "mobile",
      p_side: "right",
      p_expected: asset,
      p_asset: {
        displayPath: "new-result.webp",
        focalX: 50,
        focalY: 50,
      },
    });
    expect(mocks.remove).toHaveBeenCalledWith("hero-images", "result.webp");
    expect(mocks.revalidate.mock.calls).toEqual([["/"], ["/admin/config"]]);
  });
  it("uploads one cropped result for an empty target", async () => {
    fetchResult(
      config({
        pc: { left: null, right: null },
        mobile: { left: null, right: null },
      }),
    );
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    expect((await updateHeroImage(null, form(null))).success).toBe(true);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated requests before accessing database or storage", async () => {
    mocks.getUser.mockRejectedValue(new Error("Unauthorized"));
    expect((await updateHeroImage(null, form())).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each(["device", "side", "expected"])("rejects invalid %s", async (key) => {
    const data = form();
    data.set(key, key === "expected" ? "{}" : "invalid");
    expect((await updateHeroImage(null, data)).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    const data = form();
    data.set("expected", "bad");
    expect((await updateHeroImage(null, data)).success).toBe(false);
  });
  it.each(["missing", "text", "empty"] as const)(
    "rejects missing or empty result %s",
    async (kind) => {
      const data = form();
      data.delete("hero_image");
      if (kind !== "missing")
        data.set(
          "hero_image",
          kind === "text" ? "text" : new File([], "empty.webp"),
        );
      expect((await updateHeroImage(null, data)).success).toBe(false);
      expect(mocks.upload).not.toHaveBeenCalled();
    },
  );
  it.each(["hero_image"])("rejects oversized %s", async (key) => {
    const data = form();
    data.set(
      key,
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png"),
    );
    expect((await updateHeroImage(null, data)).error).toContain("10MB");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each([
    [null, { message: "fetch failed" }],
    [null, null],
  ])("handles absent settings", async (data, error) => {
    fetchResult(data, error);
    expect((await updateHeroImage(null, form())).success).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("prevents stale editor from overwriting a more recent edit", async () => {
    const data = form({ ...asset, displayPath: "older.webp" });
    expect((await updateHeroImage(null, data)).error).toContain("새로고침");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each(["40001", "P0001"])(
    "rolls back cropped upload on RPC error %s",
    async (code) => {
      mocks.rpc.mockResolvedValue({ data: null, error: { code } });
      expect((await updateHeroImage(null, form())).success).toBe(false);
      expect(mocks.remove.mock.calls).toEqual([
        ["hero-images", "new-result.webp"],
      ]);
      expect(mocks.revalidate).not.toHaveBeenCalled();
    },
  );
  it("handles upload failure without changing settings", async () => {
    mocks.upload.mockRejectedValueOnce(new Error("upload failed"));
    expect((await updateHeroImage(null, form())).success).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("recovers a committed save when the RPC response is lost", async () => {
    mocks.rpc.mockImplementationOnce(async () => {
      fetchResult(
        config({
          pc: {
            left: { ...asset, displayPath: "new-result.webp" },
            right: null,
          },
          mobile: { left: null, right: null },
        }),
      );
      return { data: null, error: { message: "response lost" } };
    });
    expect(await updateHeroImage(null, form())).toEqual({ success: true });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalled();
  });
  it("retains uploads when the verification request also fails", async () => {
    mocks.rpc.mockImplementationOnce(async () => {
      fetchResult(null, { message: "offline" });
      return { data: null, error: "offline" };
    });
    expect((await updateHeroImage(null, form())).error).toContain("저장 결과");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("retains uploads when verification throws", async () => {
    mocks.rpc.mockImplementationOnce(async () => {
      mocks.from.mockImplementation(() => {
        throw new Error("offline");
      });
      throw new Error("response lost");
    });
    expect((await updateHeroImage(null, form())).success).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("verifies storage references after a thrown RPC error", async () => {
    mocks.rpc.mockRejectedValueOnce(new Error("offline"));
    expect((await updateHeroImage(null, form())).success).toBe(false);
    expect(mocks.remove).toHaveBeenCalledWith("hero-images", "new-result.webp");
  });
  it("keeps successful saves successful when old-file cleanup fails", async () => {
    mocks.remove.mockRejectedValueOnce(new Error("cleanup failed"));
    expect((await updateHeroImage(null, form())).success).toBe(true);
  });
  it("does not mask a save failure when cleanup fails", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: "offline" });
    mocks.remove.mockRejectedValueOnce(new Error("cleanup failed"));
    expect((await updateHeroImage(null, form())).success).toBe(false);
  });
  it("logs revalidation errors without reporting a completed save as failed", async () => {
    mocks.revalidate.mockImplementation(() => {
      throw new Error("cache failed");
    });
    expect((await updateHeroImage(null, form())).success).toBe(true);
  });
});
