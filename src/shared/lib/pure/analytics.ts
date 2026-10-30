export const ANALYTICS_RETENTION_MONTHS = 6;
export const MILLISECONDS_PER_DAY = 86_400_000;
export const DASHBOARD_DEFAULT_DAYS = 7;
export const DASHBOARD_PERIODS = [7, 30] as const;
export const DASHBOARD_REFRESH_MS = 30_000;
export const ANALYTICS_PAGE_SIZE = 1000;

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    /^127\./.test(hostname)
  );
}

export function offsetDate(date: string, days: number): string {
  return new Date(
    new Date(`${date}T00:00:00Z`).getTime() + days * MILLISECONDS_PER_DAY,
  )
    .toISOString()
    .slice(0, 10);
}

export function endOfMonth(month: string): string {
  return new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  )
    .toISOString()
    .slice(0, 10);
}
