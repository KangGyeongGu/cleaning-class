import type { TrackRequest } from "@/shared/lib/schema/analytics";

export function track(input: TrackRequest): void {
  if (typeof window === "undefined") return;
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {
    void 0;
  });
}

export function currentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}
