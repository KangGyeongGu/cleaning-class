"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  classifySource,
  extractReferrerHost,
} from "@/shared/lib/pure/analytics-source";
import { track } from "@/shared/lib/infra/track";

export default function AnalyticsProvider(): null {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const hasRecordedLanding = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasRecordedLanding.current) return;
    hasRecordedLanding.current = true;

    const referrer = document.referrer;
    if (!referrer) return;
    const host = window.location.hostname;
    const source = classifySource(referrer, host);
    if (source === "direct") return;

    track({
      event_type: "page_landing",
      event_payload: {
        source,
        referrer_host: extractReferrerHost(referrer),
        landing_path: window.location.pathname,
      },
      path: window.location.pathname,
    });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window === "undefined" || !window.gtag) return;

    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
    });
  }, [pathname]);

  return null;
}
