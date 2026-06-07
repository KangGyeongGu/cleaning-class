import type { Metadata } from "next";
import Link from "next/link";
import {
  generateBreadcrumbListJsonLd,
  generatePriceListJsonLd,
} from "@/shared/lib/domain/json-ld";
import { getPublishedPriceItems } from "@/shared/lib/queries/price";
import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { PriceSection } from "@/components/price/PriceSection";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const revalidate = 3600;

const PAGE_DESCRIPTION =
  "전주 청소·이사 가격표 — 거주청소, 입주청소, 정기청소, 이사청소 등 서비스별 기준 요금을 안내합니다.";

export const metadata: Metadata = {
  title: "가격표",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/price" },
  openGraph: {
    title: "가격표 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
    url: "/price",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 가격표",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "가격표 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
  { name: "홈", url: "https://www.cleaningclass.co.kr" },
  { name: "가격표", url: "https://www.cleaningclass.co.kr/price" },
]);

export default async function PricePage() {
  const [items, siteConfig] = await Promise.all([
    getPublishedPriceItems(),
    getSiteConfig(),
  ]);
  const priceListJsonLd = generatePriceListJsonLd(items);
  const priceDescription =
    siteConfig?.price_description ||
    "서비스별 기준 요금을 안내합니다. 실제 금액은 현장 상태 및 면적에 따라 달라질 수 있습니다.";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <JsonLdScript data={breadcrumbJsonLd} />

      <JsonLdScript data={priceListJsonLd} />

      <section className="bg-slate-50 pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav aria-label="현재 위치" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-slate-400">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-slate-600"
                >
                  홈
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-900" aria-current="page">
                가격표
              </li>
            </ol>
          </nav>

          <h1 className="text-heading-1 mb-4">가격표</h1>
          <p className="text-body-sm max-w-lg text-slate-500">
            {priceDescription}
          </p>
        </div>
      </section>

      <PriceSection />
    </div>
  );
}
