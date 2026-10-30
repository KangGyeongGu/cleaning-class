import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { DEFAULT_REVIEW_DESCRIPTION } from "@/shared/lib/pure/constants";
import { getPublishedReviewPage } from "@/shared/lib/queries/review-page";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { ReviewsPageClient } from "@/app/(public)/reviews/ReviewsPageClient.client";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const revalidate = 3600;

const PAGE_DESCRIPTION =
  "청소클라쓰의 실제 청소·이사 작업 사례를 확인하세요. 거주청소, 정기청소, 특수청소, 쓰레기집청소, 상가청소 등 현장별 작업 내용을 소개합니다.";

export const metadata: Metadata = {
  title: "작업 사례",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "작업 사례 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
    url: "/reviews",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 청소·이사 작업 사례",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "작업 사례 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
    images: [
      { url: "/opengraph-image", alt: "청소클라쓰 청소·이사 작업 사례" },
    ],
  },
};

export default async function ReviewsPage() {
  const [initialData, siteConfig] = await Promise.all([
    getPublishedReviewPage(),
    getSiteConfig(),
  ]);

  const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
    { name: "홈", url: "https://www.cleaningclass.co.kr" },
    { name: "작업 사례", url: "https://www.cleaningclass.co.kr/reviews" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="min-h-screen bg-white">
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
                  작업 사례
                </li>
              </ol>
            </nav>

            <h1 className="text-heading-1 mb-4">작업 사례</h1>
            <p className="text-body-sm max-w-lg whitespace-pre-line text-slate-500">
              {siteConfig?.review_description?.trim() ||
                DEFAULT_REVIEW_DESCRIPTION}
            </p>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="sr-only">작업 목록</h2>
            <ReviewsPageClient initialData={initialData} />
          </div>
        </section>
      </div>
    </>
  );
}
