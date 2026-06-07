import "server-only";

const SEARCH_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yeti/i,
  /duckduckbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /applebot/i,
  /facebookexternalhit/i,
];

export function isSearchBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return SEARCH_BOT_PATTERNS.some((p) => p.test(userAgent));
}
