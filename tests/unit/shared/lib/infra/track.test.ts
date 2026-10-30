import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  track,
  trackGaEvent,
  trackApiEvent,
  currentPath,
  mapToGaEvent,
} from "@/shared/lib/infra/track";

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: vi.fn(),
}));

import { sendGAEvent } from "@next/third-parties/google";

const mockSendGAEvent = vi.mocked(sendGAEvent);

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
    mockSendGAEvent.mockClear();
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

describe("mapToGaEvent", () => {
  it.each([
    ["quote_form_success", "generate_lead"],
    ["quote_form_click", "quote_form_click"],
    ["phone_click", "generate_lead"],
    ["cta_click", "select_content"],
    ["quote_form_error", "quote_form_error"],
    ["review_card_click", "review_card_click"],
    ["sns_click", "sns_click"],
    ["faq_open", "faq_open"],
    ["review_filter", "review_filter"],
    ["page_landing", "page_landing"],
  ] as const)("maps %s → %s", (eventType, expected) => {
    expect(mapToGaEvent(eventType)).toBe(expected);
  });
});

describe("track GA4 dual-write", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    setLocation("cleaning-class.com", "/");
    mockSendGAEvent.mockClear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("calls sendGAEvent with generate_lead for quote_form_success when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "quote_form_success",
      event_payload: { inquiry_type: "cleaning" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "generate_lead", {
      inquiry_type: "cleaning",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls sendGAEvent with generate_lead for phone_click when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "phone_click",
      event_payload: { phone_type: "cleaning", click_location: "hero" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "generate_lead", {
      phone_type: "cleaning",
      click_location: "hero",
    });
  });

  it("calls sendGAEvent with select_content for cta_click when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "cta_click",
      event_payload: { content_id: "hero_cta" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "select_content", {
      content_id: "hero_cta",
    });
  });

  it("calls sendGAEvent with same name for quote_form_error when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "quote_form_error",
      event_payload: { inquiry_type: "cleaning", error_kind: "validation" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "quote_form_error", {
      inquiry_type: "cleaning",
      error_kind: "validation",
    });
  });

  it("calls sendGAEvent with same name for faq_open when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "faq_open",
      event_payload: { faq_id: "q1" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "faq_open", {
      faq_id: "q1",
    });
  });

  it("calls sendGAEvent with same name for review_filter when GA_ID set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    track({
      event_type: "review_filter",
      event_payload: { filter_category: "cleaning", filter_source: "home" },
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "review_filter", {
      filter_category: "cleaning",
      filter_source: "home",
    });
  });

  it("does not call sendGAEvent when NEXT_PUBLIC_GA_ID is empty string", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    track({
      event_type: "cta_click",
      event_payload: { content_id: "hero_cta" },
      path: "/",
    });
    expect(mockSendGAEvent).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("does not call sendGAEvent when NEXT_PUBLIC_GA_ID is undefined", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", undefined);
    track({
      event_type: "phone_click",
      event_payload: { phone_type: "moving", click_location: "footer" },
      path: "/",
    });
    expect(mockSendGAEvent).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("still calls fetch even when sendGAEvent throws (isolation)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    mockSendGAEvent.mockImplementationOnce(() => {
      throw new Error("GA error");
    });
    track({
      event_type: "cta_click",
      event_payload: { content_id: "test" },
      path: "/",
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("does not call sendGAEvent or fetch on shouldTrack()=false (/admin path)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    setLocation("cleaning-class.com", "/admin/settings");
    track({
      event_type: "cta_click",
      event_payload: { content_id: "test" },
      path: "/admin/settings",
    });
    expect(mockSendGAEvent).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not call sendGAEvent or fetch on shouldTrack()=false (localhost)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    setLocation("localhost", "/");
    track({
      event_type: "cta_click",
      event_payload: { content_id: "test" },
      path: "/",
    });
    expect(mockSendGAEvent).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes event_payload as GA4 params", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    const payload = {
      review_id: "r42",
      click_source: "home_carousel" as const,
    };
    track({
      event_type: "review_card_click",
      event_payload: payload,
      path: "/",
    });
    expect(mockSendGAEvent).toHaveBeenCalledWith(
      "event",
      "review_card_click",
      payload,
    );
  });

  it("uses empty object as GA4 params fallback when event_payload is nullish", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    const input = {
      event_type: "sns_click" as const,
      path: "/",
    } as unknown as import("@/shared/lib/schema/analytics").TrackRequest;
    track(input);
    expect(mockSendGAEvent).toHaveBeenCalledWith("event", "sns_click", {});
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

describe("방문 기록 확인", () => {
  it("API 성공 여부를 반환하고 오류는 false", async () => {
    setLocation("cleaningclass.co.kr");
    const spy = vi.spyOn(globalThis, "fetch");
    const input = {
      event_type: "page_landing" as const,
      event_payload: { source: "direct", referrer_host: "", landing_path: "/" },
      path: "/",
    };
    spy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await track(input)).toBe(true);
    spy.mockResolvedValueOnce(new Response(null, { status: 503 }));
    expect(await track(input)).toBe(false);
    spy.mockRejectedValueOnce(new Error("offline"));
    expect(await track(input)).toBe(false);
    setLocation("localhost");
    expect(await track(input)).toBe(false);
    spy.mockRestore();
  });
});

it("GA4 전용 전송도 로컬에서는 실행하지 않음", () => {
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST");
  setLocation("localhost");
  mockSendGAEvent.mockClear();
  trackGaEvent({
    event_type: "quote_form_success",
    event_payload: { inquiry_type: "cleaning" },
    path: "/contact",
  });
  expect(mockSendGAEvent).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

describe("API 전용 전송", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  it("GA4를 보내지 않고 방문 API만 요청", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST");
    setLocation("www.cleaningclass.co.kr");
    mockSendGAEvent.mockClear();
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    expect(
      await trackApiEvent({
        event_type: "page_landing",
        event_payload: {
          source: "direct",
          referrer_host: "",
          landing_path: "/",
        },
        path: "/",
      }),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockSendGAEvent).not.toHaveBeenCalled();
  });
  it("성공 견적 직접 기록과 로컬 전송을 막음", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    setLocation("www.cleaningclass.co.kr");
    expect(
      await trackApiEvent({
        event_type: "quote_form_success",
        event_payload: { inquiry_type: "cleaning" },
        path: "/contact",
      }),
    ).toBe(false);
    setLocation("localhost");
    expect(
      await trackApiEvent({
        event_type: "phone_click",
        event_payload: { phone_type: "cleaning", click_location: "hero" },
        path: "/",
      }),
    ).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
