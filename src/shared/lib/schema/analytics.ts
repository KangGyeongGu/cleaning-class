import { z } from "zod";

export const EVENT_TYPES = [
  "quote_form_click",
  "quote_form_success",
  "quote_form_error",
  "phone_click",
  "cta_click",
  "review_card_click",
  "sns_click",
  "faq_open",
  "review_filter",
  "page_landing",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

const quoteFormClickSchema = z.object({
  event_type: z.literal("quote_form_click"),
  event_payload: z.object({
    inquiry_type: z.enum(["cleaning", "moving"]),
    service_type: z.string().optional(),
  }),
});

const quoteFormSuccessSchema = z.object({
  event_type: z.literal("quote_form_success"),
  event_payload: z.object({
    inquiry_type: z.enum(["cleaning", "moving"]),
    service_type: z.string().optional(),
    has_images: z.boolean().optional(),
  }),
});

const quoteFormErrorSchema = z.object({
  event_type: z.literal("quote_form_error"),
  event_payload: z.object({
    inquiry_type: z.enum(["cleaning", "moving"]),
    error_kind: z.enum(["validation", "mail_fail", "upload_fail", "unknown"]),
    error_field: z.string().optional(),
  }),
});

const phoneClickSchema = z.object({
  event_type: z.literal("phone_click"),
  event_payload: z.object({
    phone_type: z.enum(["cleaning", "moving"]),
    click_location: z.string(),
  }),
});

const ctaClickSchema = z.object({
  event_type: z.literal("cta_click"),
  event_payload: z.object({ content_id: z.string() }),
});

const reviewCardClickSchema = z.object({
  event_type: z.literal("review_card_click"),
  event_payload: z.object({
    review_id: z.string(),
    service_type: z.string().optional(),
    click_source: z.enum(["home_carousel", "reviews_page"]),
    destination_url: z.string().optional(),
  }),
});

const snsClickSchema = z.object({
  event_type: z.literal("sns_click"),
  event_payload: z.object({
    sns_platform: z.enum(["naver_blog", "instagram", "daangn"]),
    click_location: z.string(),
  }),
});

const faqOpenSchema = z.object({
  event_type: z.literal("faq_open"),
  event_payload: z.object({ faq_id: z.string() }),
});

const reviewFilterSchema = z.object({
  event_type: z.literal("review_filter"),
  event_payload: z.object({
    filter_category: z.string(),
    filter_source: z.enum(["home", "reviews_page"]),
  }),
});

const pageLandingSchema = z.object({
  event_type: z.literal("page_landing"),
  event_payload: z.object({
    source: z.string(),
    referrer_host: z.string(),
    landing_path: z.string(),
  }),
});

export const trackRequestSchema = z
  .discriminatedUnion("event_type", [
    quoteFormClickSchema,
    quoteFormSuccessSchema,
    quoteFormErrorSchema,
    phoneClickSchema,
    ctaClickSchema,
    reviewCardClickSchema,
    snsClickSchema,
    faqOpenSchema,
    reviewFilterSchema,
    pageLandingSchema,
  ])
  .and(z.object({ path: z.string().min(1).max(500) }));

export type TrackRequest = z.infer<typeof trackRequestSchema>;
