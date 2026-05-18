"use client";

import { useState, useEffect } from "react";
import { ServiceCard } from "@/components/ServiceCard";

interface ServiceItem {
  id: string;
  title: string;

  tags: string[];
  imageUrl: string;
  afterImageUrl?: string;
  focalX?: number;
  focalY?: number;
  afterFocalX?: number;
  afterFocalY?: number;
}

interface ServiceGridProps {
  services: ServiceItem[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const hasAfterImages = services.some((s) => s.afterImageUrl);

  useEffect(() => {
    if (!hasAfterImages) return;

    const mq = window.matchMedia("(hover: none)");

    let interval: ReturnType<typeof setInterval> | null = null;

    function start() {
      setIsTouchDevice(true);
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        setShowAfter((prev) => !prev);
      }, 3000);
    }

    function stop() {
      setIsTouchDevice(false);
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
  }, [hasAfterImages]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-8 lg:grid-cols-5">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          priority={false}
          showAfter={isTouchDevice && showAfter && !!service.afterImageUrl}
        />
      ))}
    </div>
  );
}
