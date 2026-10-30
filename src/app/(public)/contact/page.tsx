import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { getPublishedPriceItems } from "@/shared/lib/queries/price";
import { ContactSection } from "@/components/form/ContactSection.client";
import { SocialLinks } from "@/components/social/SocialLinks.client";
import TrackedPhoneLink from "@/components/analytics/TrackedPhoneLink.client";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "온라인 견적",
  description:
    "청소클라쓰에 청소·이사 견적을 문의하세요. 전화로도 편하게 연락하실 수 있습니다.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "온라인 견적 | 청소클라쓰",
    description:
      "청소클라쓰에 청소·이사 견적을 문의하세요. 전화로도 편하게 연락하실 수 있습니다.",
    url: "/contact",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 온라인 견적",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "온라인 견적 | 청소클라쓰",
    description:
      "청소클라쓰에 청소·이사 견적을 문의하세요. 전화로도 편하게 연락하실 수 있습니다.",
  },
};

export default async function ContactPage() {
  const [siteConfig, priceItems] = await Promise.all([
    getSiteConfig(),
    getPublishedPriceItems(),
  ]);
  const cleaningServiceOptions = priceItems.map((p) => p.name);

  const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
    { name: "홈", url: "https://www.cleaningclass.co.kr" },
    { name: "온라인 견적", url: "https://www.cleaningclass.co.kr/contact" },
  ]);

  const phone = (siteConfig?.phone ?? "").trim();
  const movingPhone = (siteConfig?.moving_phone ?? "").trim();

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="min-h-screen bg-white">
        <section className="pt-12 pb-16 md:pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_2fr] lg:gap-20">
              <aside>
                <div className="lg:sticky lg:top-24">
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
                        온라인 견적
                      </li>
                    </ol>
                  </nav>

                  <h1 className="text-heading-1 mb-4">온라인 견적</h1>
                  <p className="text-body-sm mb-10 text-slate-500">
                    문의 후 24시간 이내에 연락드립니다.
                    <br />
                    급한 문의는 전화로 연락해 주세요.
                  </p>

                  {phone && (
                    <div className="mb-6">
                      <p className="mb-1 text-sm font-medium text-slate-900">
                        청소 연락
                      </p>

                      <TrackedPhoneLink
                        href={`tel:${phone.replace(/\D/g, "")}`}
                        phoneType="cleaning"
                        location="contact_aside"
                        className="text-lg font-semibold text-slate-900 underline-offset-2 transition-colors hover:text-slate-600 hover:underline"
                      >
                        {phone}
                      </TrackedPhoneLink>
                    </div>
                  )}

                  {movingPhone && (
                    <div className="mb-6">
                      <p className="mb-1 text-sm font-medium text-slate-900">
                        이사 연락
                      </p>

                      <TrackedPhoneLink
                        href={`tel:${movingPhone.replace(/\D/g, "")}`}
                        phoneType="moving"
                        location="contact_aside"
                        className="text-lg font-semibold text-slate-900 underline-offset-2 transition-colors hover:text-slate-600 hover:underline"
                      >
                        {movingPhone}
                      </TrackedPhoneLink>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex justify-center gap-4">
                      <SocialLinks urls={siteConfig} location="contact_aside" />
                    </div>
                  </div>
                </div>
              </aside>

              <div>
                <ContactSection
                  cleaningServiceOptions={cleaningServiceOptions}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
