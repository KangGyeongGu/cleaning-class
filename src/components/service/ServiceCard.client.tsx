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
    <div className="group h-full pb-4 md:pb-0">
      <Link
        href={`/services#service-${service.id}`}
        aria-label={`${service.title} 서비스 상세 보기`}
        className="block h-full transition-[translate] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 motion-reduce:transition-none md:group-focus-within:-translate-y-1.5 md:group-hover:-translate-y-1.5 motion-reduce:md:group-focus-within:translate-y-0 motion-reduce:md:group-hover:translate-y-0"
        onClick={() =>
          track({
            event_type: "cta_click",
            event_payload: { content_id: `service_card_${service.id}` },
            path: currentPath(),
          })
        }
      >
        {service.imageUrl && (
          <div className="relative mb-3 aspect-[4/3] overflow-hidden bg-slate-200 md:mb-5 md:aspect-3/4">
            <Image
              src={service.imageUrl}
              alt={service.title}
              fill
              sizes="(max-width: 767px) 88vw, (max-width: 1023px) 33vw, 211px"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover"
              style={{
                objectPosition: `${service.focalX ?? 50}% ${service.focalY ?? 50}%`,
              }}
            />
            {service.afterImageUrl && (
              <Image
                src={service.afterImageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1023px) 33vw, 211px"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className={`object-cover transition-opacity duration-500 ease-out group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none ${showAfter ? "opacity-100" : "opacity-0"}`}
                style={{
                  objectPosition: `${service.afterFocalX ?? 50}% ${service.afterFocalY ?? 50}%`,
                }}
              />
            )}
          </div>
        )}
        <div className="px-1">
          <h3 className="text-heading-4 mb-2">{service.title}</h3>
          <p className="text-sm leading-relaxed [overflow-wrap:anywhere] [word-break:keep-all] whitespace-pre-line text-slate-600">
            {service.description}
          </p>
        </div>
      </Link>
    </div>
  );
}
