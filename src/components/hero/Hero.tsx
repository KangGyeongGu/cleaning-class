import Image from "next/image";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { getHeroImageUrl } from "@/shared/lib/supabase/storage";
import { BLUR_PLACEHOLDER } from "@/shared/lib/pure/constants";
import { HeroCTA } from "@/components/hero/HeroCTA.client";

export async function Hero(): Promise<React.JSX.Element> {
  const siteConfig = await getSiteConfig();

  const displayName = siteConfig?.business_name ?? "청소클라쓰";
  const description = siteConfig?.description ?? undefined;
  const phone = siteConfig?.phone;
  const movingPhone = siteConfig?.moving_phone;

  const heroImage1 = siteConfig?.hero_image_path
    ? getHeroImageUrl(siteConfig.hero_image_path)
    : "";
  const heroImage2 = siteConfig?.hero_image_path_2
    ? getHeroImageUrl(siteConfig.hero_image_path_2)
    : "";

  const focal1 = {
    x: siteConfig?.hero_image_focal_x ?? 50,
    y: siteConfig?.hero_image_focal_y ?? 50,
  };
  const focal2 = {
    x: siteConfig?.hero_image_focal_x_2 ?? 50,
    y: siteConfig?.hero_image_focal_y_2 ?? 50,
  };

  const hasImage1 = heroImage1 !== "";
  const hasImage2 = heroImage2 !== "";
  const hasBothImages = hasImage1 && hasImage2;
  const hasAnyImage = hasImage1 || hasImage2;

  return (
    <section
      className={[
        "relative flex w-full flex-col items-center justify-center overflow-hidden",
        "h-[50svh] py-12 md:h-auto md:min-h-[50svh] md:py-20",
        hasAnyImage ? "bg-slate-900 text-white" : "bg-white text-slate-900",
      ].join(" ")}
    >
      {hasAnyImage ? (
        <>
          <div className="absolute inset-0">
            {hasImage1 && (
              <div
                className="absolute top-0 bottom-0 left-0 overflow-hidden"
                style={{
                  width: "100%",
                  animation: hasBothImages
                    ? "heroImageSlideLeft 1.4s cubic-bezier(0.16,1,0.3,1) both"
                    : "heroImageReveal 1.6s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                <div
                  className={
                    hasBothImages
                      ? "absolute inset-0 [clip-path:polygon(0_0,100%_0,0_100%)] md:w-[60%] md:[clip-path:polygon(0_0,91.67%_0,75%_100%,0_100%)]"
                      : "absolute inset-0"
                  }
                >
                  <Image
                    src={heroImage1}
                    fill
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    alt={`${displayName} 청소 서비스`}
                    className="object-cover"
                    style={{ objectPosition: `${focal1.x}% ${focal1.y}%` }}
                    sizes={
                      hasBothImages ? "(max-width: 768px) 100vw, 60vw" : "100vw"
                    }
                  />
                </div>
              </div>
            )}
            {hasImage2 && (
              <div
                className="absolute top-0 right-0 bottom-0 overflow-hidden"
                style={{
                  width: "100%",
                  animation: hasImage1
                    ? "heroImageSlideRight 1.4s 0.15s cubic-bezier(0.16,1,0.3,1) both"
                    : "heroImageReveal 1.6s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                <div
                  className={
                    hasImage1
                      ? "absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[60%] md:[clip-path:polygon(25%_0,100%_0,100%_100%,8.33%_100%)]"
                      : "absolute inset-0"
                  }
                >
                  <Image
                    src={heroImage2}
                    fill
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    alt={`${displayName} 청소 서비스 현장`}
                    className="object-cover"
                    style={{ objectPosition: `${focal2.x}% ${focal2.y}%` }}
                    sizes={
                      hasImage1 ? "(max-width: 768px) 100vw, 60vw" : "100vw"
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className="absolute inset-0 bg-slate-900/55"
            style={{ animation: "heroOverlayFade 0.8s 1.2s ease-out both" }}
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-white opacity-5"
            aria-hidden="true"
          />
          <div
            className="absolute top-1/4 right-1/4 hidden h-64 w-64 rounded-full bg-gradient-to-b from-slate-50 to-white opacity-60 md:block md:blur-2xl"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-1/3 left-1/4 hidden h-48 w-48 rounded-full bg-gradient-to-t from-slate-50 to-white opacity-60 md:block md:blur-2xl"
            aria-hidden="true"
          />
        </>
      )}

      <div
        className="relative z-10 mx-auto max-w-5xl px-4 text-center md:px-8 lg:px-12"
        style={
          hasAnyImage
            ? {
                animation:
                  "fadeInScale 0.8s 1s cubic-bezier(0.16,1,0.3,1) both",
              }
            : undefined
        }
      >
        <p
          className={[
            "text-label mb-4 tracking-widest md:mb-6",
            hasAnyImage ? "text-white/70" : "text-slate-400",
          ].join(" ")}
          style={
            !hasAnyImage
              ? { animation: "fadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both" }
              : undefined
          }
        >
          전문 청소 서비스
        </p>

        <h1
          className={[
            "text-display mb-4 md:mb-6",
            hasAnyImage ? "text-white" : "",
          ].join(" ")}
          style={
            !hasAnyImage
              ? { animation: "slideUp 1s cubic-bezier(0.16,1,0.3,1) both" }
              : undefined
          }
        >
          {displayName}.
        </h1>

        <p
          className={[
            "text-subtitle mb-8 md:mb-12",
            hasAnyImage ? "font-light text-white/85" : "",
          ].join(" ")}
          style={
            !hasAnyImage
              ? { animation: "slideUp 1s 0.3s cubic-bezier(0.16,1,0.3,1) both" }
              : undefined
          }
        >
          {description ?? "완벽함을 넘어선 쾌적함을 선사합니다."}
        </p>

        <HeroCTA
          phone={phone}
          movingPhone={movingPhone}
          variant={hasAnyImage ? "dark" : "light"}
        />
      </div>
    </section>
  );
}
