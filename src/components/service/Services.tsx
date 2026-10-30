import Link from "next/link";
import { DEFAULT_SERVICE_DESCRIPTION } from "@/shared/lib/pure/constants";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { getPublishedServicesWithImageUrls } from "@/shared/lib/queries/service";
import { generateServiceJsonLd } from "@/shared/lib/domain/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { ServiceTabs } from "@/components/service/ServiceTabs.client";

export async function Services() {
  const [servicesWithImageUrls, siteConfig] = await Promise.all([
    getPublishedServicesWithImageUrls(),
    getSiteConfig(),
  ]);

  if (!servicesWithImageUrls || servicesWithImageUrls.length === 0) {
    return null;
  }

  const serviceDescription =
    siteConfig?.service_description?.trim() || DEFAULT_SERVICE_DESCRIPTION;

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
        <h2 className="text-heading-1 mb-4 text-center">
          <Link
            href="/services"
            className="transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
          >
            SERVICE
          </Link>
        </h2>
        <ServiceTabs
          description={serviceDescription}
          cleaning={cleaningServices}
          moving={movingServices}
        />
      </div>
    </section>
  );
}
