"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  classifySource,
  extractReferrerHost,
} from "@/shared/lib/pure/analytics-source";
import { trackApiEvent, trackGaEvent } from "@/shared/lib/infra/track";
import { kstDate } from "@/shared/lib/pure/dashboard";

export default function AnalyticsProvider(): null {
  const pathname = usePathname();
  const hasRecordedGaLanding = useRef(false);
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const landing = {
      event_type: "page_landing" as const,
      event_payload: {
        source: classifySource(document.referrer, window.location.hostname),
        referrer_host: extractReferrerHost(document.referrer),
        landing_path: pathname,
      },
      path: pathname,
    };
    if (!hasRecordedGaLanding.current) {
      hasRecordedGaLanding.current = true;
      if (landing.event_payload.source !== "direct") trackGaEvent(landing);
    }
    let lastDay = "";
    let sending = false;
    let active = true;
    const record = async () => {
      if (document.visibilityState === "hidden") return;
      const day = kstDate();
      if (lastDay === day || sending) return;
      sending = true;
      const recorded = await trackApiEvent(landing);
      sending = false;
      if (recorded && active) lastDay = day;
    };
    record();
    const timer = window.setInterval(record, 60_000);
    document.addEventListener("visibilitychange", record);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", record);
    };
  }, [pathname]);
  return null;
}
