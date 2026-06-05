"use client";

import { useEffect, useRef, useState } from "react";

interface ReviewRatingHeroProps {
  avgRating: number;
  totalCount: number;
}

const STAR_PATH =
  "M10 1.667l2.575 5.217 5.758.838-4.166 4.063.983 5.732L10 14.583l-5.15 2.934.983-5.732L1.667 7.722l5.758-.838L10 1.667z";
const FILLED = "#0f172a";
const EMPTY = "#e2e8f0";

function SlateStarRating({ rating }: { rating: number }): React.ReactElement {
  const size = 28;

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`별점 ${rating}점`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i;
        const fillType = diff >= 1 ? "full" : diff >= 0.5 ? "half" : "empty";
        const clipId = `gold-half-${i}`;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {fillType === "half" && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="10" height="20" />
                </clipPath>
              </defs>
            )}

            {fillType !== "full" && (
              <path
                d={STAR_PATH}
                fill="none"
                stroke={EMPTY}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {fillType === "full" && (
              <path
                d={STAR_PATH}
                fill={FILLED}
                stroke={FILLED}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {fillType === "half" && (
              <path
                d={STAR_PATH}
                fill={FILLED}
                stroke={FILLED}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#${clipId})`}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ReviewRatingHero({
  avgRating,
  totalCount,
}: ReviewRatingHeroProps): React.ReactElement {
  const [displayRating, setDisplayRating] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [startCountUp, setStartCountUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setTriggered(true);
          timer = setTimeout(() => {
            setStartCountUp(true);
          }, 800);
        }
      },
      { threshold: 0.8 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!startCountUp) return;

    const duration = 2500;
    const start = performance.now();

    const animate = (now: number): void => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const current = Math.round(eased * avgRating * 10) / 10;
      setDisplayRating(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayRating(avgRating);
      }
    };

    requestAnimationFrame(animate);
  }, [avgRating, startCountUp]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <span className="text-5xl font-black text-slate-900 tabular-nums md:text-6xl">
        {displayRating.toFixed(1)}
      </span>
      <span
        className="text-sm text-slate-500 transition-all duration-500 ease-out"
        style={{
          opacity: triggered ? 1 : 0,
          transform: triggered ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        {totalCount}건의 리뷰
      </span>
      <SlateStarRating rating={triggered ? avgRating : 0} />
    </div>
  );
}
