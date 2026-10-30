"use client";

import { useState, useEffect, useRef } from "react";
import {
  ServiceCard,
  type ServiceCardProps,
} from "@/components/service/ServiceCard.client";

interface ServiceGridProps {
  services: ServiceCardProps["service"][];
  active?: boolean;
}

export function ServiceGrid({ services, active = true }: ServiceGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAfter, setShowAfter] = useState(false);

  const hasAfterImages = services.some((s) => s.afterImageUrl);

  useEffect(() => {
    if (!active || !hasAfterImages) return;

    const mq = window.matchMedia("(hover: none)");

    let interval: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        setShowAfter((prev) => !prev);
      }, 3000);
    }

    function stop() {
      setShowAfter(false);
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) start();
      else stop();
    }

    handleChange(mq);
    mq.addEventListener("change", handleChange);

    return () => {
      mq.removeEventListener("change", handleChange);
      stop();
    };
  }, [active, hasAfterImages]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !active) return;
    element.scrollTo({ left: 0, behavior: "instant" });
    const update = () => {
      const cards = Array.from(element.children);
      const bounds = element.getBoundingClientRect();
      const center = bounds.left + element.clientWidth / 2;
      let closest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardBounds = card.getBoundingClientRect();
        const offset = Math.abs(
          cardBounds.left + cardBounds.width / 2 - center,
        );
        if (offset < distance) {
          closest = index;
          distance = offset;
        }
      });
      setActiveIndex(closest);
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [services, active]);

  return (
    <div>
      <div
        ref={scrollRef}
        role="region"
        aria-label="서비스 목록"
        tabIndex={0}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[6%] pb-2 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 lg:grid-cols-5"
      >
        {services.map((service) => (
          <div
            key={service.id}
            className="w-full shrink-0 snap-center md:w-auto"
          >
            <ServiceCard
              service={service}
              showAfter={showAfter && !!service.afterImageUrl}
            />
          </div>
        ))}
      </div>
      {services.length > 1 && (
        <div
          role="img"
          aria-label={`서비스 ${services.length}개 중 ${activeIndex + 1}번째`}
          className="mt-4 flex justify-center gap-2 md:hidden"
        >
          {services.map((service, index) => (
            <span
              key={service.id}
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full transition-colors ${index === activeIndex ? "bg-slate-900" : "bg-slate-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
