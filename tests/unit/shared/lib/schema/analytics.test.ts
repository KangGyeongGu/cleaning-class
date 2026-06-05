import { describe, it, expect } from "vitest";
import { EVENT_TYPES, trackRequestSchema } from "@/shared/lib/schema/analytics";

describe("EVENT_TYPES", () => {
  it("should contain 10 distinct event types", () => {
    expect(EVENT_TYPES.length).toBe(10);
    expect(new Set(EVENT_TYPES).size).toBe(10);
  });
});

describe("trackRequestSchema", () => {
  it("should accept valid quote_form_click", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "quote_form_click",
      event_payload: { inquiry_type: "cleaning", service_type: "입주청소" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid quote_form_success with has_images", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "quote_form_success",
      event_payload: {
        inquiry_type: "moving",
        service_type: "원룸이사",
        has_images: true,
      },
      path: "/contact",
    });
    expect(result.success).toBe(true);
  });

  it("should accept quote_form_error with mail_fail", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "quote_form_error",
      event_payload: { inquiry_type: "cleaning", error_kind: "mail_fail" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should reject quote_form_error with unknown error_kind", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "quote_form_error",
      event_payload: { inquiry_type: "cleaning", error_kind: "xxx" },
      path: "/",
    });
    expect(result.success).toBe(false);
  });

  it("should accept phone_click", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "phone_click",
      event_payload: { phone_type: "cleaning", click_location: "hero_cta" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept cta_click", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "cta_click",
      event_payload: { content_id: "hero_quote_button" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept review_card_click", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "review_card_click",
      event_payload: {
        review_id: "abc",
        click_source: "home_carousel",
      },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept sns_click", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "sns_click",
      event_payload: { sns_platform: "naver_blog", click_location: "footer" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept faq_open", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "faq_open",
      event_payload: { faq_id: "f1" },
      path: "/help",
    });
    expect(result.success).toBe(true);
  });

  it("should accept review_filter", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "review_filter",
      event_payload: { filter_category: "입주청소", filter_source: "home" },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should accept page_landing", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "page_landing",
      event_payload: {
        source: "naver",
        referrer_host: "search.naver.com",
        landing_path: "/",
      },
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  it("should reject unknown event_type", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "bad_event",
      event_payload: {},
      path: "/",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing path", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "cta_click",
      event_payload: { content_id: "x" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject path > 500 chars", () => {
    const result = trackRequestSchema.safeParse({
      event_type: "cta_click",
      event_payload: { content_id: "x" },
      path: "/".padEnd(501, "a"),
    });
    expect(result.success).toBe(false);
  });
});
