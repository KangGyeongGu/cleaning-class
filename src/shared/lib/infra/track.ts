import type { TrackRequest } from "@/shared/lib/schema/analytics";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function shouldTrack(): boolean {
  if (typeof window === "undefined") return false;
  if (LOCAL_HOSTS.has(window.location.hostname)) return false;
  if (window.location.pathname.startsWith("/admin")) return false;
  return true;
}

export function track(input: TrackRequest): void {
  if (!shouldTrack()) return;
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
