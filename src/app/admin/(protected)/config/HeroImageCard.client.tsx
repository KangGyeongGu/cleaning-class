"use client";

import { useId, useState } from "react";
import { Pencil, ImageOff } from "lucide-react";
import {
  HeroCropDialog,
  type HeroImageSlot,
} from "@/app/admin/(protected)/config/HeroCropDialog.client";
import { HeroPreview } from "@/app/admin/(protected)/config/HeroPreview.client";
import type { SiteConfig } from "@/shared/types/database";

import {
  getHeroImages,
  HERO_CLIPS,
  type HeroConfig as HeroImageConfig,
} from "@/shared/lib/domain/hero-images";
type HeroConfig = HeroImageConfig &
  Pick<SiteConfig, "business_name" | "description">;

export function HeroImageCard({ config }: { config: HeroConfig }) {
  const headingId = useId();
  const [editing, setEditing] = useState<HeroImageSlot | null>(null);
  const variants = getHeroImages(config);
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-sm font-bold text-slate-900">
        배경이미지
      </h2>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {(["pc", "mobile"] as const).map((device) => {
          const mobile = device === "mobile";
          const label = mobile ? "모바일" : "PC";
          const slots: HeroImageSlot[] = (["left", "right"] as const).map(
            (side) => ({
              device,
              side,
              label: `${label} ${side === "left" ? "좌측" : "우측"} 배경이미지`,
              asset: variants[device][side],
            }),
          );
          const hasImages = slots.some((slot) => slot.asset);

          const deviceId = `${headingId}-${device}`;
          return (
            <section
              key={device}
              aria-labelledby={deviceId}
              className="min-w-0"
            >
              <h3
                id={deviceId}
                className="mb-3 text-xs font-medium text-slate-500"
              >
                {label}
              </h3>
              <div
                className={`relative w-full overflow-hidden ${mobile ? "max-w-[17rem]" : ""} ${hasImages ? "bg-slate-900" : "aspect-[2/1] bg-slate-100"}`}
                aria-label={`${label} 배너 미리보기`}
              >
                {hasImages ? (
                  <HeroPreview
                    key={JSON.stringify([
                      variants[device],
                      config.business_name,
                      config.description,
                    ])}
                    device={device}
                  />
                ) : (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <ImageOff size={16} aria-hidden="true" />
                    등록된 이미지 없음
                  </div>
                )}
                {slots.map((slot) => (
                  <button
                    key={slot.side}
                    type="button"
                    aria-label={`${slot.label} 수정`}
                    onClick={() => setEditing(slot)}
                    className={`group absolute inset-y-0 cursor-pointer transition-colors outline-none hover:bg-white/10 focus-visible:bg-white/10 ${slot.side === "left" ? "left-0" : "right-0"}`}
                    style={{
                      width: mobile ? "100%" : "60%",
                      clipPath: HERO_CLIPS[device][slot.side],
                    }}
                  >
                    <span
                      className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 border border-white/60 bg-slate-900/80 px-3 py-2 text-xs leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      style={{
                        left: mobile
                          ? slot.side === "left"
                            ? "30%"
                            : "70%"
                          : "50%",
                        top: mobile
                          ? slot.side === "left"
                            ? "30%"
                            : "70%"
                          : "50%",
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      {slot.side === "left" ? "좌측 수정" : "우측 수정"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {editing && (
        <HeroCropDialog
          key={`${editing.device}-${editing.side}`}
          slot={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
