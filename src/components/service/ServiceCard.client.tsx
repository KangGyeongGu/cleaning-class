"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { BLUR_PLACEHOLDER } from "@/shared/lib/pure/constants";
import { track, currentPath } from "@/shared/lib/infra/track";

export interface ServiceCardProps {
  service: {
    id: string;
    title: string;

    tags: string[];
    imageUrl: string;
    afterImageUrl?: string;
    focalX?: number;
    focalY?: number;
    afterFocalX?: number;
    afterFocalY?: number;
  };
  priority: boolean;

  showAfter?: boolean;
}

export function ServiceCard({
  service,
  priority,
  showAfter = false,
}: ServiceCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group pb-4 transition-all duration-600 ease-out md:pb-0 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
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
          <div className="relative mb-3 aspect-square overflow-hidden bg-slate-200 transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl md:mb-5 md:aspect-3/4">
            {service.afterImageUrl ? (
              <>
                <Image
                  src={service.imageUrl}
                  alt={`${service.title} Before`}
                  fill
                  sizes="(max-width: 768px) calc(50vw - 8px), (max-width: 1024px) 33vw, 211px"
                  priority={priority}
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
                  sizes="(max-width: 768px) calc(50vw - 8px), (max-width: 1024px) 33vw, 211px"
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
                sizes="(max-width: 768px) calc(50vw - 8px), (max-width: 1024px) 33vw, 211px"
                priority={priority}
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
      <div className="px-1 transition-transform duration-500 ease-out group-hover:-translate-y-2">
        <h3 className="text-heading-4 mb-2 transition-colors duration-300 group-hover:text-black">
          {service.title}
        </h3>
        <p className="text-xs text-slate-400 transition-colors duration-300 group-hover:text-slate-600">
          {service.tags.join(" · ")}
        </p>
      </div>
    </div>
  );
}
