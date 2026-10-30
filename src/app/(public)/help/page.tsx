import type { Metadata } from "next";
import Link from "next/link";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { FaqSection } from "@/components/faq/FaqSection";
import { ContactCta } from "@/components/common/ContactCta";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const revalidate = 3600;

const PAGE_DESCRIPTION =
  "청소·이사 예약, 서비스 지역, 결제 방법 등 청소클라쓰에 자주 묻는 질문과 답변을 확인하세요.";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://www.cleaningclass.co.kr/help",
  },
  openGraph: {
    title: "자주 묻는 질문 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
    url: "https://www.cleaningclass.co.kr/help",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 자주 묻는 질문",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "자주 묻는 질문 | 청소클라쓰",
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
  { name: "홈", url: "https://www.cleaningclass.co.kr" },
  { name: "자주 묻는 질문", url: "https://www.cleaningclass.co.kr/help" },
]);

const DEFAULT_FAQ_DESCRIPTION =
  "자주 묻는 질문을 확인하세요.\n궁금한 내용이 해결되지 않으면 전화로 문의해 주세요.";

export default async function HelpPage() {
  const siteConfig = await getSiteConfig();
  const faqDescription =
    siteConfig?.faq_description?.trim() || DEFAULT_FAQ_DESCRIPTION;

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
                  자주 묻는 질문
                </li>
              </ol>
            </nav>

            <h1 className="text-heading-1 mb-4">자주 묻는 질문</h1>
            <p className="text-body-sm max-w-lg whitespace-pre-line text-slate-500">
              {faqDescription}
            </p>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <FaqSection />
          </div>
        </section>

        <ContactCta
          contentId="help_page_quote"
          description="찾으시는 답변이 없으신가요? 부담 없이 연락 주시면 빠르게 안내해 드립니다."
        />
      </div>
    </>
  );
}
