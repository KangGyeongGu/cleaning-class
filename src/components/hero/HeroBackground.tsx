import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { getHeroImageUrl } from "@/shared/lib/supabase/storage";
import { HERO_CLIPS, type HeroImages } from "@/shared/lib/domain/hero-images";

export function HeroBackground({
  images,
  displayName,
}: {
  images: HeroImages;
  displayName: string;
}) {
  const pcBoth = Boolean(images.pc.left && images.pc.right);
  const mobileBoth = Boolean(images.mobile.left && images.mobile.right);
  return (
    <div className="absolute inset-0">
      {(["left", "right"] as const).map((side) => {
        const pc = images.pc[side];
        const mobile = images.mobile[side];
        const fallback = pc ?? mobile;
        if (!fallback) return null;
        const mobileProps = mobile
          ? getImageProps({
              src: getHeroImageUrl(mobile.displayPath),
              alt: "",
              fill: true,
              sizes: "100vw",
            }).props
          : null;
        const style = {
          "--hero-pc-clip": pcBoth ? HERO_CLIPS.pc[side] : "none",
          "--hero-mobile-clip": mobileBoth ? HERO_CLIPS.mobile[side] : "none",
          "--hero-pc-position": `${pc?.focalX ?? 50}% ${pc?.focalY ?? 50}%`,
          "--hero-mobile-position": `${mobile?.focalX ?? 50}% ${mobile?.focalY ?? 50}%`,
          animation: `heroImageSlide${side === "left" ? "Left" : "Right"} 1.4s ${side === "left" ? "0s" : "0.15s"} cubic-bezier(0.16,1,0.3,1) both`,
        } as CSSProperties;
        return (
          <div
            key={side}
            className={`absolute inset-y-0 w-full overflow-hidden [clip-path:var(--hero-mobile-clip)] md:[clip-path:var(--hero-pc-clip)] ${side === "left" ? "left-0" : "right-0"} ${pcBoth ? "md:w-[60%]" : "md:w-full"} ${mobile ? "block" : "hidden"} ${pc ? "md:block" : "md:hidden"}`}
            style={style}
          >
            <picture>
              {mobileProps && (
                <source
                  media="(max-width: 767px)"
                  srcSet={mobileProps.srcSet}
                  sizes={mobileProps.sizes}
                />
              )}
              <Image
                src={getHeroImageUrl(fallback.displayPath)}
                alt={`${displayName} ${side === "left" ? "청소 서비스" : "청소 서비스 현장"}`}
                fill
                loading="eager"
                fetchPriority="high"
                sizes={pcBoth ? "(max-width: 767px) 100vw, 60vw" : "100vw"}
                className="object-cover [object-position:var(--hero-mobile-position)] md:[object-position:var(--hero-pc-position)]"
              />
            </picture>
          </div>
        );
      })}
    </div>
  );
}
