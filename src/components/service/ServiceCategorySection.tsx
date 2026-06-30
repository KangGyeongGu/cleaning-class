import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import TrackedCtaLink from "@/components/analytics/TrackedCtaLink.client";
import TrackedPhoneLink from "@/components/analytics/TrackedPhoneLink.client";
import { ServiceGrid } from "@/components/service/ServiceGrid.client";
import type { ServiceWithImageUrls } from "@/shared/lib/queries/service";

type Category = "cleaning" | "moving";

interface ServiceCategorySectionProps {
  category: Category;
  label: string;
  heading: string;
  services: ServiceWithImageUrls[];
  phone?: string;
  detailHref: string;
  contactContentId: "services_cleaning_contact" | "services_moving_contact";
  className?: string;
}

export function ServiceCategorySection({
  category,
  label,
  heading,
  services,
  phone,
  detailHref,
  contactContentId,
  className,
}: ServiceCategorySectionProps): React.ReactElement | null {
  if (services.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-label mb-1 text-slate-400">{label}</p>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            {heading}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <TrackedCtaLink
            href="/contact"
            contentId={contactContentId}
            className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
          >
            문의하기 <ArrowUpRight size={12} aria-hidden="true" />
          </TrackedCtaLink>

          {phone && (
            <TrackedPhoneLink
              href={`tel:${phone}`}
              phoneType={category}
              location="services_section"
              className="flex items-center gap-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              전화문의 <ArrowUpRight size={12} aria-hidden="true" />
            </TrackedPhoneLink>
          )}
        </div>
      </div>
      <ServiceGrid services={services} />
      <div className="mt-6 text-center">
        <Link
          href={detailHref}
          className="inline-block text-sm font-medium tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
        >
          상세 보기 →
        </Link>
      </div>
    </div>
  );
}
