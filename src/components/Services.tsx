import { getSiteConfig } from "@/shared/lib/site-config";
import { getPublishedServicesWithImageUrls } from "@/shared/lib/home";
import { generateServiceJsonLd } from "@/shared/lib/json-ld";
import { JsonLdScript } from "@/components/JsonLdScript";
import { ServiceCategorySection } from "@/components/ServiceCategorySection";

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

        <ServiceCategorySection
          category="cleaning"
          label="Cleaning"
          heading="청소 서비스"
          services={cleaningServices}
          phone={siteConfig?.phone}
          detailHref="/services#cleaning-services"
          contactContentId="services_cleaning_contact"
          className="mb-16 md:mb-24"
        />

        <ServiceCategorySection
          category="moving"
          label="Moving"
          heading="이사 서비스"
          services={movingServices}
          phone={siteConfig?.moving_phone}
          detailHref="/services#moving-services"
          contactContentId="services_moving_contact"
        />
      </div>
    </section>
  );
}
