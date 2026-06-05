import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_KEY = process.env.KAKAO_REST_API_KEY;

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  process.env.KAKAO_REST_API_KEY = "test-key";
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.KAKAO_REST_API_KEY;
  else process.env.KAKAO_REST_API_KEY = ORIGINAL_KEY;
});

describe("reverseGeocodeKakao", () => {
  it("returns road_address when available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              road_address: { address_name: "전북 전주시 효자로 1" },
              address: { address_name: "전북 전주시 효자동" },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBe("전북 전주시 효자로 1");
  });

  it("falls back to jibun address when no road address", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [{ address: { address_name: "전북 전주시 효자동" } }],
        }),
        { status: 200 },
      ),
    );
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBe("전북 전주시 효자동");
  });

  it("returns null when documents is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ documents: [] }), { status: 200 }),
    );
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBeNull();
  });

  it("returns null when documents missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBeNull();
  });

  it("returns null on HTTP error and logs", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("err", { status: 500 }),
    );
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it("returns null on fetch rejection and logs", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("net"));
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it("returns null when KAKAO_REST_API_KEY missing", async () => {
    delete process.env.KAKAO_REST_API_KEY;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { reverseGeocodeKakao } =
      await import("@/shared/lib/infra/reverse-geocode");
    expect(await reverseGeocodeKakao(35.8, 127.1)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
