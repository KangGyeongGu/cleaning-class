"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AnalyticsProvider(): null {
  const pathname = usePathname();

  const isFirstRender = useRef(true);

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
