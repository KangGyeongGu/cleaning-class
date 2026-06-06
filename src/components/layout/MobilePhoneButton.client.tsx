"use client";

import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { track, currentPath } from "@/shared/lib/infra/track";

interface MobilePhoneButtonProps {
  phone: string;
  movingPhone?: string;
}

export function MobilePhoneButton({
  phone,
  movingPhone,
}: MobilePhoneButtonProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/contact")) return null;

  const hasBoth = !!movingPhone;

  if (hasBoth) {
    return (
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 flex overflow-hidden rounded-2xl bg-slate-900 shadow-lg md:hidden">
        <a
          href={`tel:${phone}`}
          className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-bold tracking-wide text-white active:bg-slate-800"
          onClick={() =>
            track({
              event_type: "phone_click",
              event_payload: {
                phone_type: "cleaning",
                click_location: "mobile_bottom",
              },
              path: currentPath(),
            })
          }
        >
          <Phone size={14} aria-hidden="true" />
          청소 상담
        </a>
        <span className="my-2.5 w-px bg-slate-700" aria-hidden="true" />
        <a
          href={`tel:${movingPhone}`}
          className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-bold tracking-wide text-white active:bg-slate-800"
          onClick={() =>
            track({
              event_type: "phone_click",
              event_payload: {
                phone_type: "moving",
                click_location: "mobile_bottom",
              },
              path: currentPath(),
            })
          }
        >
          <Phone size={14} aria-hidden="true" />
          이사 상담
        </a>
      </div>
    );
  }

  return (
    <a
      href={`tel:${phone}`}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-bold tracking-wide text-white shadow-lg active:bg-slate-800 md:hidden"
      onClick={() =>
        track({
          event_type: "phone_click",
          event_payload: {
            phone_type: "cleaning",
            click_location: "mobile_bottom",
          },
          path: currentPath(),
        })
      }
    >
      <Phone size={14} aria-hidden="true" />
      전화 상담
    </a>
  );
}
