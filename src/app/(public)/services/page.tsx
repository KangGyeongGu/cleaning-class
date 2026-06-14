import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { getPublishedServicesWithImageUrls } from "@/shared/lib/queries/service";
import type { ServiceWithImageUrls } from "@/shared/lib/queries/service";
import { ServiceBeforeAfter } from "@/components/service/ServiceBeforeAfter.client";
import { HashHighlight } from "@/app/(public)/services/HashHighlight.client";
import { BLUR_PLACEHOLDER } from "@/shared/lib/domain/image";
import { ContactCta } from "@/components/common/ContactCta";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export const revalidate = 3600;

const PAGE_DESCRIPTION =
  "청소클라쓰의 전문 청소·이사 서비스를 소개합니다. 거주청소, 정기청소, 특수청소, 원룸이사, 포장이사 등.";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: {
    title: "서비스 소개 | 청소클라쓰",
    description: "청소클라쓰의 전문 청소·이사 서비스를 소개합니다.",
    url: "/services",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 서비스 소개",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "서비스 소개 | 청소클라쓰",
    description: "청소클라쓰의 전문 청소·이사 서비스를 소개합니다.",
  },
};

const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
  { name: "홈", url: "https://www.cleaningclass.co.kr" },
  { name: "서비스 소개", url: "https://www.cleaningclass.co.kr/services" },
]);

interface ServiceTextCardProps {
  service: ServiceWithImageUrls;
}

function ServiceTextCard({ service }: ServiceTextCardProps) {
  return (
    <article
      id={`service-${service.id}`}
      className="scroll-mt-24 border-t border-slate-100 pt-8"
    >
      <h3 className="mb-3 text-lg font-black tracking-tight text-slate-900">
        {service.title}
      </h3>
      {service.description && (
        <p className="mb-5 text-sm leading-relaxed text-slate-600">
          {service.description}
        </p>
      )}
      {service.tags.length > 0 && (
        <ul className="space-y-1.5">
          {service.tags.map((tag) => (
            <li
              key={tag}
              className="flex items-start gap-2 text-sm text-slate-500"
            >
              <span
                className="mt-2 h-px w-3 shrink-0 bg-slate-300"
                aria-hidden="true"
              />
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

interface ServiceCategorySectionProps {
  id: string;
  label: string;
  heading: string;
  services: ServiceWithImageUrls[];
}

function ServiceCategorySection({
  id,
  label,
  heading,
  services,
}: ServiceCategorySectionProps) {
  if (services.length === 0) return null;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="px-6 py-12 md:py-16"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
          {label}
        </p>
        <h2
          id={`${id}-heading`}
          className="mb-6 text-3xl font-black tracking-tight text-slate-900 md:text-4xl"
        >
          {heading}
        </h2>

        {services.filter((s) => s.detailImageUrl).length > 0 && (
          <div>
            {services
              .filter((s) => s.detailImageUrl)
              .map((service, index) => (
                <article
                  key={service.id}
                  id={`service-${service.id}`}
                  className="group scroll-mt-24 border-t border-slate-100 py-12 first:border-t-0"
                >
                  <div
                    className={`flex flex-col gap-8 md:flex-row md:items-start md:gap-16 ${
                      index % 2 !== 0 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="w-full shrink-0 md:w-80">
                      {service.detailAfterImageUrl ? (
                        <ServiceBeforeAfter
                          beforeSrc={service.detailImageUrl!}
                          afterSrc={service.detailAfterImageUrl}
                          alt={service.title}
                        />
                      ) : (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={service.detailImageUrl!}
                            alt={service.title}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 768px) calc(100vw - 48px), 320px"
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="mb-3 text-xl font-black tracking-tight text-slate-900">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="mb-6 text-sm leading-relaxed text-slate-600">
                          {service.description}
                        </p>
                      )}
                      {service.tags.length > 0 && (
                        <ul className="space-y-2">
                          {service.tags.map((tag) => (
                            <li
                              key={tag}
                              className="flex items-start gap-2 text-sm text-slate-500"
                            >
                              <span
                                className="mt-2 h-px w-4 shrink-0 bg-slate-300"
                                aria-hidden="true"
                              />
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}

        {services.filter((s) => !s.detailImageUrl).length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
            {services
              .filter((s) => !s.detailImageUrl)
              .map((service) => (
                <ServiceTextCard key={service.id} service={service} />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function ServicesPage() {
  const [cleaningServices, movingServices] = await Promise.all([
    getPublishedServicesWithImageUrls("cleaning"),
    getPublishedServicesWithImageUrls("moving"),
  ]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <HashHighlight />

      <JsonLdScript data={breadcrumbJsonLd} />

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
                서비스 소개
              </li>
            </ol>
          </nav>

          <h1 className="text-heading-1 mb-4">서비스 소개</h1>
          <p className="text-body-sm max-w-lg text-slate-500">
            전문 청소 서비스부터 이사 서비스까지,
            <br className="hidden sm:block" />
            청소클라쓰가 깔끔하게 처리합니다.
          </p>
        </div>
      </section>

      <ServiceCategorySection
        id="cleaning-services"
        label="Cleaning"
        heading="청소 서비스"
        services={cleaningServices}
      />

      {cleaningServices.length > 0 && movingServices.length > 0 && (
        <div className="mx-auto max-w-5xl px-6">
          <div className="border-t border-slate-200" />
        </div>
      )}

      <ServiceCategorySection
        id="moving-services"
        label="Moving"
        heading="이사 서비스"
        services={movingServices}
      />

      <ContactCta
        contentId="services_page_quote"
        description="원하시는 서비스가 있으신가요? 부담 없이 연락 주시면 빠르게 안내해 드립니다."
      />
    </div>
  );
}
