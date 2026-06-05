import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackGenerateLead,
  trackPhoneClick,
  trackSelectContent,
  trackReviewCardClick,
  trackSnsClick,
  trackFaqOpen,
  trackReviewFilter,
} from "@/shared/lib/infra/analytics";

const gtagSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal("window", {
    ...globalThis.window,
    gtag: gtagSpy,
  });
  gtagSpy.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackGenerateLead", () => {
  it("calls gtag with 'generate_lead' event when window.gtag exists", () => {
    trackGenerateLead({
      currency: "KRW",
      value: 0,
      lead_source: "quote_form",
      service_type: "거주청소",
      inquiry_type: "cleaning",
    });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "generate_lead",
      expect.objectContaining({ inquiry_type: "cleaning" }),
    );
  });

  it("noops when gtag is undefined", () => {
    vi.stubGlobal("window", { ...globalThis.window, gtag: undefined });
    expect(() =>
      trackGenerateLead({
        currency: "KRW",
        value: 0,
        lead_source: "quote_form",
        service_type: "x",
        inquiry_type: "moving",
      }),
    ).not.toThrow();
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackPhoneClick", () => {
  it("uses 'generate_lead' event name with phone_click source", () => {
    trackPhoneClick({
      currency: "KRW",
      value: 0,
      lead_source: "phone_click",
      phone_type: "cleaning",
      click_location: "footer",
    });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "generate_lead",
      expect.objectContaining({ click_location: "footer" }),
    );
  });

  it("noops when gtag is unavailable", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackPhoneClick({
      currency: "KRW",
      value: 0,
      lead_source: "phone_click",
      phone_type: "moving",
      click_location: "hero_cta",
    });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackSelectContent", () => {
  it("sends 'select_content' event with cta_button params", () => {
    trackSelectContent({
      content_type: "cta_button",
      content_id: "navbar_contact",
    });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "select_content",
      expect.objectContaining({ content_id: "navbar_contact" }),
    );
  });

  it("noops when gtag is missing", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackSelectContent({
      content_type: "cta_button",
      content_id: "hero_quote_button",
    });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackReviewCardClick", () => {
  it("sends review_card_click event", () => {
    trackReviewCardClick({
      review_id: "r1",
      review_title: "t",
      service_type: "거주청소",
      click_source: "home_carousel",
      destination_url: "https://blog.example.com/post/1",
    });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "review_card_click",
      expect.any(Object),
    );
  });

  it("noops when gtag is missing", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackReviewCardClick({
      review_id: "r1",
      review_title: "t",
      service_type: "x",
      click_source: "reviews_page",
      destination_url: "https://x.com",
    });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackSnsClick", () => {
  it("sends sns_click event with platform info", () => {
    trackSnsClick({
      sns_platform: "naver_blog",
      click_location: "footer",
    });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "sns_click",
      expect.objectContaining({ sns_platform: "naver_blog" }),
    );
  });

  it("noops without gtag", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackSnsClick({ sns_platform: "instagram", click_location: "navbar" });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackFaqOpen", () => {
  it("sends faq_open event", () => {
    trackFaqOpen({ faq_id: "1", faq_question: "Q" });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "faq_open",
      expect.any(Object),
    );
  });

  it("noops without gtag", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackFaqOpen({ faq_id: "1", faq_question: "Q" });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});

describe("trackReviewFilter", () => {
  it("sends review_filter event", () => {
    trackReviewFilter({ filter_category: "거주청소", filter_source: "home" });
    expect(gtagSpy).toHaveBeenCalledWith(
      "event",
      "review_filter",
      expect.objectContaining({ filter_source: "home" }),
    );
  });

  it("noops without gtag", () => {
    vi.stubGlobal("window", { gtag: undefined });
    trackReviewFilter({
      filter_category: "전체",
      filter_source: "reviews_page",
    });
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});
