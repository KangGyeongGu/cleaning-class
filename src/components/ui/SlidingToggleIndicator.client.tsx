"use client";

import { motion, useReducedMotion } from "motion/react";

interface SlidingToggleIndicatorProps {
  layoutId: string;
}

export function SlidingToggleIndicator({
  layoutId,
}: SlidingToggleIndicatorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 bg-white shadow-sm"
      style={{ borderRadius: 9999 }}
      transition={{
        layout: { duration: reducedMotion ? 0 : 0.22, ease: "easeOut" },
      }}
    />
  );
}
