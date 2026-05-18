import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteConfig } from "@/shared/lib/site-config";
import { getPublishedServicesWithImageUrls } from "@/shared/lib/home";
import { generateServiceJsonLd } from "@/shared/lib/json-ld";
import { ServiceGrid } from "@/components/ServiceGrid";
import TrackedCtaLink from "@/components/analytics/TrackedCtaLink.client";
import TrackedPhoneLink from "@/components/analytics/TrackedPhoneLink.client";
import { JsonLdScript } from "@/components/JsonLdScript";

export async function Services() {
  const [servicesWithImageUrls, siteConfig] = await Promise.all([
    getPublishedServicesWithImageUrls(),
    getSiteConfig(),
  ]);

  if (!servicesWithImageUrls || servicesWithImageUrls.length === 0) {
    return null;
  }

  const serviceDescription = siteConfig?.service_description ?? undefined;

  const serviceJsonLd = generateServiceJsonLd(
    servicesWithImageUrls,
    siteConfig?.site_url,
  );

  const cleaningServices = servicesWithImageUrls.filter(
    (s) => s.category === "cleaning",
  );
  const movingServices = servicesWithImageUrls.filter(
    (s) => s.category === "moving",
  );

  const cleaningPhone = siteConfig?.phone ?? "010-6711-2964";
  const movingPhone = siteConfig?.moving_phone ?? "010-3654-0102";

  return (
    <section id="services" className="relative bg-white py-16 md:py-32">
      <JsonLdScript data={serviceJsonLd} />

      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="text-heading-1 mb-4">SERVICE</h2>
          <p className="text-body-sm tracking-wide text-slate-500 md:text-base">
            {serviceDescription ||
              "공간의 성격에 맞는 최적의 서비스를 제공합니다."}
          </p>
        </div>

        {cleaningServices.length > 0 && (
          <div className="mb-16 md:mb-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Cleaning
                </p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  청소 서비스
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <TrackedCtaLink
                  href="/contact"
                  contentId="services_cleaning_contact"
                  className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
                >
                  문의하기 <ArrowUpRight size={12} aria-hidden="true" />
                </TrackedCtaLink>

                <TrackedPhoneLink
                  href={`tel:${cleaningPhone}`}
                  phoneType="cleaning"
                  location="services_section"
                  className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
                >
                  전화문의 <ArrowUpRight size={12} aria-hidden="true" />
                </TrackedPhoneLink>
              </div>
            </div>
            <ServiceGrid services={cleaningServices} />
            <div className="mt-6 text-center">
              <Link
                href="/services#cleaning-services"
                className="inline-block text-sm font-medium tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
              >
                상세 보기 →
              </Link>
            </div>
          </div>
        )}

        {movingServices.length > 0 && (
          <div>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Moving
                </p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  이사 서비스
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <TrackedCtaLink
                  href="/contact"
                  contentId="services_moving_contact"
                  className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
                >
                  문의하기 <ArrowUpRight size={12} aria-hidden="true" />
                </TrackedCtaLink>

                <TrackedPhoneLink
                  href={`tel:${movingPhone}`}
                  phoneType="moving"
                  location="services_section"
                  className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
                >
                  전화문의 <ArrowUpRight size={12} aria-hidden="true" />
                </TrackedPhoneLink>
              </div>
            </div>
            <ServiceGrid services={movingServices} />
            <div className="mt-6 text-center">
              <Link
                href="/services#moving-services"
                className="inline-block text-sm font-medium tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
              >
                상세 보기 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
