"use client";

import Image from "next/image";
import Link from "next/link";

import { BLUR_PLACEHOLDER } from "@/shared/lib/pure/constants";
import { track, currentPath } from "@/shared/lib/infra/track";

export interface ServiceCardProps {
  service: {
    id: string;
    title: string;

    description: string;
    imageUrl: string;
    afterImageUrl?: string;
    focalX?: number;
    focalY?: number;
    afterFocalX?: number;
    afterFocalY?: number;
  };

  showAfter?: boolean;
}

export function ServiceCard({ service, showAfter = false }: ServiceCardProps) {
  return (
    <div className="group pb-4 md:pb-0">
      {service.imageUrl && (
        <Link
          href={`/services#service-${service.id}`}
          className="block"
          onClick={() =>
            track({
              event_type: "cta_click",
              event_payload: { content_id: `service_card_${service.id}` },
              path: currentPath(),
            })
          }
        >
          <div className="relative mb-3 aspect-[4/3] overflow-hidden bg-slate-200 transition-all duration-500 ease-out md:mb-5 md:aspect-3/4 md:hover:-translate-y-3 md:hover:shadow-2xl">
            {service.afterImageUrl ? (
              <>
                <Image
                  src={service.imageUrl}
                  alt={`${service.title} Before`}
                  fill
                  sizes="(max-width: 767px) 88vw, (max-width: 1024px) 33vw, 211px"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className={`object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 ${
                    showAfter ? "opacity-0" : ""
                  }`}
                  style={{
                    objectPosition: `${service.focalX ?? 50}% ${service.focalY ?? 50}%`,
                  }}
                />
                <Image
                  src={service.afterImageUrl}
                  alt={`${service.title} After`}
                  fill
                  sizes="(max-width: 767px) 88vw, (max-width: 1024px) 33vw, 211px"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className={`absolute inset-0 object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100 ${
                    showAfter ? "opacity-100!" : ""
                  }`}
                  style={{
                    objectPosition: `${service.afterFocalX ?? 50}% ${service.afterFocalY ?? 50}%`,
                  }}
                />
              </>
            ) : (
              <Image
                src={service.imageUrl}
                alt={service.title}
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 33vw, 211px"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                style={{
                  objectPosition: `${service.focalX ?? 50}% ${service.focalY ?? 50}%`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
          </div>
        </Link>
      )}
      <div className="px-1 transition-transform duration-500 ease-out md:group-hover:-translate-y-2">
        <h3 className="text-heading-4 mb-2 transition-colors duration-300 group-hover:text-black">
          {service.title}
        </h3>
        <p className="text-sm leading-relaxed [overflow-wrap:anywhere] [word-break:keep-all] whitespace-pre-line text-slate-600">
          {service.description}
        </p>
      </div>
    </div>
  );
}
