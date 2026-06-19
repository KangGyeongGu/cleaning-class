import { sendGAEvent } from "@next/third-parties/google";
import type { EventType, TrackRequest } from "@/shared/lib/schema/analytics";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function shouldTrack(): boolean {
  if (typeof window === "undefined") return false;
  if (LOCAL_HOSTS.has(window.location.hostname)) return false;
  if (window.location.pathname.startsWith("/admin")) return false;
  return true;
}

const GA_EVENT_MAP: Record<EventType, string> = {
  quote_form_success: "generate_lead",
  quote_form_click: "generate_lead",
  phone_click: "generate_lead",
  cta_click: "select_content",
  quote_form_error: "quote_form_error",
  review_card_click: "review_card_click",
  sns_click: "sns_click",
  faq_open: "faq_open",
  review_filter: "review_filter",
  page_landing: "page_landing",
};

export function mapToGaEvent(eventType: EventType): string {
  return GA_EVENT_MAP[eventType];
}

export function track(input: TrackRequest): void {
  if (!shouldTrack()) return;

  if (process.env.NEXT_PUBLIC_GA_ID) {
    try {
      sendGAEvent(
        "event",
        mapToGaEvent(input.event_type),
        input.event_payload ?? {},
      );
    } catch {
      void 0;
    }
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {
    void 0;
  });
}

export function currentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}
