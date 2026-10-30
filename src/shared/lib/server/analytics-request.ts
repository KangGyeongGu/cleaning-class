import "server-only";
import { isLocalHostname } from "@/shared/lib/pure/analytics";

export function shouldRecordAnalytics(headers: Headers): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const host = headers.get("host");
  if (!host) return false;
  try {
    return !isLocalHostname(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
}
