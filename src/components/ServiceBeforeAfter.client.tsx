"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { BLUR_PLACEHOLDER } from "@/shared/lib/image";

interface ServiceBeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
}

export function ServiceBeforeAfter({
  beforeSrc,
  afterSrc,
  alt,
}: ServiceBeforeAfterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.6", "center 0.4"],
  });

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden"
    >
      <Image
        src={beforeSrc}
        alt={`${alt} — 작업 전`}
        fill
        sizes="(max-width: 768px) calc(100vw - 48px), 320px"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        className="object-cover"
      />

      <motion.div
        className="absolute inset-0"
        style={{ clipPath, willChange: "clip-path" }}
      >
        <Image
          src={afterSrc}
          alt={`${alt} — 작업 후`}
          fill
          sizes="(max-width: 768px) calc(100vw - 48px), 320px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}
