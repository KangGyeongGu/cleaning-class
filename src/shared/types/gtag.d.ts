interface GtagConfigParams extends Record<string, unknown> {
  page_title?: string;
  page_location?: string;
  send_page_view?: boolean;
}

type GtagSetParams = Record<string, unknown>;

type GtagEventParams = Record<string, unknown>;

interface Gtag {
  (command: "config", targetId: string, params?: GtagConfigParams): void;
  (command: "event", eventName: string, params?: GtagEventParams): void;
  (command: "js", date: Date): void;
  (command: "set", params: GtagSetParams): void;
  (command: "set", targetId: string, params: GtagSetParams): void;
}

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: Record<string, unknown>[];
  }
}

export type { Gtag, GtagConfigParams, GtagSetParams, GtagEventParams };
