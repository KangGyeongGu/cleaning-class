import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track, currentPath } from "@/shared/lib/infra/track";

function setLocation(hostname: string, pathname = "/"): void {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      hostname,
      pathname,
      host: hostname,
      href: `https://${hostname}${pathname}`,
    },
    configurable: true,
  });
}

describe("track", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    setLocation("cleaning-class.com", "/");
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

  it.each(["localhost", "127.0.0.1", "::1"])(
    "should be no-op on local host %s",
    (host) => {
      setLocation(host, "/");
      track({
        event_type: "cta_click",
        event_payload: { content_id: "navbar_contact" },
        path: "/",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("should be no-op on /admin paths", () => {
    setLocation("cleaning-class.com", "/admin/dashboard");
    track({
      event_type: "page_landing",
      event_payload: {
        source: "google",
        referrer_host: "google.com",
        landing_path: "/admin/dashboard",
      },
      path: "/admin/dashboard",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("currentPath", () => {
  it("returns window.location.pathname when window is defined", () => {
    expect(currentPath()).toBe(window.location.pathname);
  });

  it('returns "/" when window is undefined', () => {
    const win = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });
    try {
      expect(currentPath()).toBe("/");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: win,
        configurable: true,
      });
    }
  });
});
