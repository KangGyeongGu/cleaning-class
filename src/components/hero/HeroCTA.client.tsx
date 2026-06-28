"use client";

import Link from "next/link";
import { track, currentPath } from "@/shared/lib/infra/track";

export type HeroCTAVariant = "light" | "dark";

interface HeroCTAProps {
  phone?: string;
  movingPhone?: string;
  variant?: HeroCTAVariant;
}

export function HeroCTA({
  phone,
  movingPhone,
  variant = "light",
}: HeroCTAProps): React.JSX.Element {
  const isDark = variant === "dark";
  const hasAnyPhone = phone || movingPhone;

  return (
    <div className="animate-[fadeInScale_0.8s_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
      <Link
        href="/contact"
        className={[
          "group relative inline-block overflow-hidden border px-7 py-2.5 text-sm font-bold transition-all md:px-10 md:py-4 md:text-lg",
          isDark
            ? "border-white text-white hover:text-slate-900"
            : "border-slate-900 text-slate-900 hover:text-white",
        ].join(" ")}
        onClick={() =>
          track({
            event_type: "cta_click",
            event_payload: { content_id: "hero_quote_button" },
            path: currentPath(),
          })
        }
      >
        <span
          className={[
            "absolute inset-0 h-full w-full origin-left scale-x-0 transform transition-transform duration-300 ease-out group-hover:scale-x-100",
            isDark ? "bg-white" : "bg-slate-900",
          ].join(" ")}
          aria-hidden="true"
        />
        <span className="relative z-10">무료 견적 받기</span>
      </Link>

      {hasAnyPhone && (
        <div
          className={[
            "mt-4 flex flex-col items-center justify-center gap-1 text-xs font-light sm:mt-6 sm:flex-row sm:gap-6 sm:text-base",
            isDark ? "text-white/80" : "text-slate-600",
          ].join(" ")}
          style={{ animation: "fadeIn 0.8s 0.9s both" }}
        >
          {phone && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span>청소상담</span>
              <a
                href={`tel:${phone}`}
                className={[
                  "inline-flex items-center text-sm font-bold tracking-tight transition-colors sm:min-h-12 sm:text-lg",
                  isDark
                    ? "text-white hover:text-white/80"
                    : "text-slate-900 hover:text-slate-700",
                ].join(" ")}
                onClick={() =>
                  track({
                    event_type: "phone_click",
                    event_payload: {
                      phone_type: "cleaning",
                      click_location: "hero_cta",
                    },
                    path: currentPath(),
                  })
                }
              >
                {phone}
              </a>
            </div>
          )}
          {movingPhone && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span>이사상담</span>
              <a
                href={`tel:${movingPhone}`}
                className={[
                  "inline-flex items-center text-sm font-bold tracking-tight transition-colors sm:min-h-12 sm:text-lg",
                  isDark
                    ? "text-white hover:text-white/80"
                    : "text-slate-900 hover:text-slate-700",
                ].join(" ")}
                onClick={() =>
                  track({
                    event_type: "phone_click",
                    event_payload: {
                      phone_type: "moving",
                      click_location: "hero_cta",
                    },
                    path: currentPath(),
                  })
                }
              >
                {movingPhone}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
