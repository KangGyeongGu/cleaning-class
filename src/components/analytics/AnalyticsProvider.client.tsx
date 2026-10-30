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
  const lastRecordedDay = useRef("");
  const sending = useRef(false);
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
    const record = async () => {
      if (document.visibilityState === "hidden") return;
      const day = kstDate();
      if (lastRecordedDay.current === day || sending.current) return;
      sending.current = true;
      const recorded = await trackApiEvent(landing);
      sending.current = false;
      if (recorded) lastRecordedDay.current = day;
    };
    record();
    const timer = window.setInterval(record, 60_000);
    document.addEventListener("visibilitychange", record);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", record);
    };
  }, [pathname]);
  return null;
}
