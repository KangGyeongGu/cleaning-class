import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track } from "@/shared/lib/infra/track";

describe("track", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should POST to /api/track with JSON body", () => {
    track({
      event_type: "cta_click",
      event_payload: { content_id: "hero_quote_button" },
      path: "/",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/track",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
      }),
    );
  });

  it("should serialize body as JSON", () => {
    track({
      event_type: "phone_click",
      event_payload: { phone_type: "cleaning", click_location: "hero_cta" },
      path: "/",
    });
    const call = fetchSpy.mock.calls[0];
    const init = call[1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      event_type: "phone_click",
      event_payload: { phone_type: "cleaning", click_location: "hero_cta" },
      path: "/",
    });
  });

  it("should swallow fetch errors (fire-and-forget)", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("network"));
    expect(() =>
      track({
        event_type: "faq_open",
        event_payload: { faq_id: "f1" },
        path: "/help",
      }),
    ).not.toThrow();
  });

  it("should be no-op on server (typeof window undefined)", () => {
    const win = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });
    try {
      track({
        event_type: "cta_click",
        event_payload: { content_id: "navbar_contact" },
        path: "/",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: win,
        configurable: true,
      });
    }
  });
});
