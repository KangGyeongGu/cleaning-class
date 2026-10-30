"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroDevice } from "@/shared/lib/domain/hero-images";

const VIEWPORTS = {
  pc: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

export function HeroPreview({ device }: { device: HeroDevice }) {
  const viewport = VIEWPORTS[device];
  const container = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState<number>(viewport.height / 2);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    resize.observe(element);
    return () => {
      resize.disconnect();
      observer.current?.disconnect();
    };
  }, []);

  return (
    <div
      ref={container}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${viewport.width} / ${height}` }}
    >
      <iframe
        sandbox="allow-same-origin"
        src="/admin/hero-preview"
        title={`${device === "pc" ? "PC" : "모바일"} 배너 실제 미리보기`}
        tabIndex={-1}
        aria-hidden="true"
        width={viewport.width}
        height={viewport.height}
        className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left border-0"
        style={{
          width: viewport.width,
          height: viewport.height,
          transform: `scale(${width / viewport.width})`,
        }}
        onLoad={(event) => {
          observer.current?.disconnect();
          const hero =
            event.currentTarget.contentDocument?.querySelector<HTMLElement>(
              "[data-hero]",
            );
          if (!hero) {
            setFailed(true);
            return;
          }
          setFailed(false);
          observer.current = new ResizeObserver(() =>
            setHeight(hero.getBoundingClientRect().height),
          );
          observer.current.observe(hero);
          setHeight(hero.getBoundingClientRect().height);
        }}
      />
      {failed && (
        <p
          role="alert"
          className="absolute inset-0 flex items-center justify-center text-xs text-slate-400"
        >
          미리보기를 불러오지 못했습니다.
        </p>
      )}
    </div>
  );
}
