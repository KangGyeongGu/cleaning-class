import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { getHeroImages } from "@/shared/lib/domain/hero-images";
import { HeroCTA } from "@/components/hero/HeroCTA.client";

export async function Hero(): Promise<React.JSX.Element> {
  const siteConfig = await getSiteConfig();

  const displayName = siteConfig?.business_name ?? "청소클라쓰";
  const description = siteConfig?.description ?? undefined;
  const phone = siteConfig?.phone;
  const movingPhone = siteConfig?.moving_phone;

  const images = getHeroImages(siteConfig);
  const hasAnyImage = Boolean(
    images.pc.left ||
    images.pc.right ||
    images.mobile.left ||
    images.mobile.right,
  );

  return (
    <section
      data-hero
      className={[
        "relative flex w-full flex-col items-center justify-center overflow-hidden",
        "h-[50svh] py-12 md:h-auto md:min-h-[50svh] md:py-20",
        hasAnyImage ? "bg-slate-900 text-white" : "bg-white text-slate-900",
      ].join(" ")}
    >
      {hasAnyImage ? (
        <>
          <HeroBackground images={images} displayName={displayName} />

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
