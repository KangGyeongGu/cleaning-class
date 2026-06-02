import { ArrowRight } from "lucide-react";
import TrackedCtaLink from "@/components/analytics/TrackedCtaLink.client";

export function PriceBanner(): React.JSX.Element {
  return (
    <section aria-label="가격표 바로가기" className="bg-slate-100">
      <TrackedCtaLink
        href="/price"
        contentId="home_price_banner"
        className="group mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold tracking-widest text-slate-600 uppercase transition-colors hover:text-slate-900 md:text-sm"
      >
        가격표 보기
        <ArrowRight
          size={14}
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5"
        />
      </TrackedCtaLink>
    </section>
  );
}
