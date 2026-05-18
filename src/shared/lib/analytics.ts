type BaseEventParams = Record<string, unknown>;

type GenerateLeadFormParams = BaseEventParams & {
  currency: "KRW";
  value: 0;
  lead_source: "quote_form";
  service_type: string;
  inquiry_type: "cleaning" | "moving";
};

type GenerateLeadPhoneParams = BaseEventParams & {
  currency: "KRW";
  value: 0;
  lead_source: "phone_click";
  phone_type: "cleaning" | "moving";
  click_location: PhoneClickLocation;
};

type PhoneClickLocation =
  | "mobile_bottom"
  | "hero_cta"
  | "services_section"
  | "contact_form"
  | "contact_aside"
  | "footer";

type SelectContentParams = BaseEventParams & {
  content_type: "cta_button";
  content_id: CtaButtonId;
};

type CtaButtonId =
  | "hero_quote_button"
  | "services_cleaning_contact"
  | "services_moving_contact"
  | "services_page_quote"
  | "navbar_contact"
  | `service_card_${string}`;

type ReviewCardClickParams = BaseEventParams & {
  review_id: string;
  review_title: string;
  service_type: string;
  click_source: "home_carousel" | "reviews_page";
  destination_url: string;
};

type SnsClickParams = BaseEventParams & {
  sns_platform: "naver_blog" | "instagram" | "daangn";
  click_location: "navbar" | "footer" | "reviews_section" | "contact_aside";
};

type FaqOpenParams = BaseEventParams & {
  faq_id: string;
  faq_question: string;
};

type ReviewFilterParams = BaseEventParams & {
  filter_category: string;
  filter_source: "home" | "reviews_page";
};

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function trackGenerateLead(params: GenerateLeadFormParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "generate_lead", params);
}

export function trackPhoneClick(params: GenerateLeadPhoneParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "generate_lead", params);
}

export function trackSelectContent(params: SelectContentParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "select_content", params);
}

export function trackReviewCardClick(params: ReviewCardClickParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "review_card_click", params);
}

export function trackSnsClick(params: SnsClickParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "sns_click", params);
}

export function trackFaqOpen(params: FaqOpenParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "faq_open", params);
}

export function trackReviewFilter(params: ReviewFilterParams): void {
  if (!canTrack()) return;
  window.gtag!("event", "review_filter", params);
}

export type { PhoneClickLocation, CtaButtonId, SnsClickParams };
