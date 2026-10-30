"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "motion/react";
import { ServiceGrid } from "@/components/service/ServiceGrid.client";
import type { ServiceCardProps } from "@/components/service/ServiceCard.client";

interface ServiceTabsProps {
  description: string;
  cleaning: ServiceCardProps["service"][];
  moving: ServiceCardProps["service"][];
}

export function ServiceTabs({
  description,
  cleaning,
  moving,
}: ServiceTabsProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { once: true, amount: 0.1 });
  const controls = useAnimationControls();
  const hasCleaning = cleaning.length > 0;
  const hasMoving = moving.length > 0;
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState<"cleaning" | "moving">(
    hasCleaning ? "cleaning" : "moving",
  );

  useEffect(() => {
    if (!inView) return;
    void controls.start({
      opacity: [reducedMotion ? 1 : 0, 1],
      transition: { duration: reducedMotion ? 0 : 0.2, ease: "easeOut" },
    });
  }, [category, controls, inView, reducedMotion]);

  return (
    <>
      <p className="text-body-sm text-center tracking-wide whitespace-pre-line text-slate-500 md:text-base">
        {description}
      </p>
      <div className="mt-6 mb-6 flex justify-center md:mb-8">
        <div
          role="group"
          aria-label="서비스 종류"
          className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1"
        >
          {(
            [
              { value: "cleaning", label: "청소", enabled: hasCleaning },
              { value: "moving", label: "이사", enabled: hasMoving },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={category === option.value}
              aria-controls={`${id}-${option.value}`}
              disabled={!option.enabled}
              onClick={() => setCategory(option.value)}
              className={`min-h-8 min-w-20 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${category === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <motion.div
        ref={panelRef}
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={controls}
      >
        <div id={`${id}-cleaning`} hidden={category !== "cleaning"}>
          <ServiceGrid services={cleaning} active={category === "cleaning"} />
        </div>
        <div id={`${id}-moving`} hidden={category !== "moving"}>
          <ServiceGrid services={moving} active={category === "moving"} />
        </div>
      </motion.div>
    </>
  );
}
