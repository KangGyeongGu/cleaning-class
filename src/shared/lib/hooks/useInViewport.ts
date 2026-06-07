"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseInViewportResult {
  ref: (el: Element | null) => void;
  isVisible: boolean;
}

export function useInViewport(
  options: IntersectionObserverInit = { threshold: 0.1 },
): UseInViewportResult {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (el: Element | null) => {
      observerRef.current?.disconnect();
      if (!el) return;
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      }, options);
      observer.observe(el);
      observerRef.current = observer;
    },
    [options],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref, isVisible };
}
