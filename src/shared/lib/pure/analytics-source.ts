export type TrafficSource =
  | "google"
  | "naver"
  | "daum"
  | "bing"
  | "chatgpt"
  | "perplexity"
  | "claude"
  | "gemini"
  | "instagram"
  | "facebook"
  | "youtube"
  | "daangn"
  | "direct"
  | "referral";

const PATTERNS: ReadonlyArray<readonly [RegExp, TrafficSource]> = [
  [/^gemini\.google\.com$/, "gemini"],
  [/(?:^|\.)gemini\.google\.com$/, "gemini"],
  [/(?:^|\.)google\.[a-z.]+$/, "google"],
  [/^naver\.com$/, "naver"],
  [/(?:^|\.)naver\.com$/, "naver"],
  [/^daum\.net$/, "daum"],
  [/(?:^|\.)daum\.net$/, "daum"],
  [/^kakao\.com$/, "daum"],
  [/(?:^|\.)kakao\.com$/, "daum"],
  [/^bing\.com$/, "bing"],
  [/(?:^|\.)bing\.com$/, "bing"],
  [/^chatgpt\.com$/, "chatgpt"],
  [/(?:^|\.)openai\.com$/, "chatgpt"],
  [/^perplexity\.ai$/, "perplexity"],
  [/(?:^|\.)perplexity\.ai$/, "perplexity"],
  [/^claude\.ai$/, "claude"],
  [/(?:^|\.)anthropic\.com$/, "claude"],
  [/^instagram\.com$/, "instagram"],
  [/(?:^|\.)instagram\.com$/, "instagram"],
  [/^l\.instagram\.com$/, "instagram"],
  [/^facebook\.com$/, "facebook"],
  [/(?:^|\.)facebook\.com$/, "facebook"],
  [/^l\.facebook\.com$/, "facebook"],
  [/^fb\.me$/, "facebook"],
  [/^youtube\.com$/, "youtube"],
  [/(?:^|\.)youtube\.com$/, "youtube"],
  [/^m\.youtube\.com$/, "youtube"],
  [/^daangn\.com$/, "daangn"],
  [/(?:^|\.)daangn\.com$/, "daangn"],
];

export function classifySource(
  referrer: string,
  currentHost: string,
): TrafficSource {
  if (!referrer) return "direct";

  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "referral";
  }

  const host = url.hostname.toLowerCase();
  const own = currentHost.toLowerCase();
  const ownBase = own.replace(/^www\./, "");

  if (host === own || host === ownBase || host.endsWith(`.${ownBase}`)) {
    return "direct";
  }

  for (const [pattern, source] of PATTERNS) {
    if (pattern.test(host)) return source;
  }

  return "referral";
}

export function extractReferrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return "";
  }
}
