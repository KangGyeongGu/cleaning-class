import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { getAllPublishedReviews } from "@/shared/lib/queries/review";
import {
  getPublishedServicesWithImageUrls,
  type ServiceWithImageUrls,
} from "@/shared/lib/queries/service";
import type { Review, SiteConfig } from "@/shared/types/database";

export const revalidate = 3600;

const SITE_URL = "https://www.cleaningclass.co.kr";
const FEED_URL = `${SITE_URL}/feed.xml`;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRfc822(dateStr: string): string {
  return new Date(dateStr).toUTCString();
}

function buildServiceItems(services: ServiceWithImageUrls[]): string {
  return services
    .map(
      (s) => `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${SITE_URL}#services</link>
      <description>${escapeXml(s.description)}</description>
      <pubDate>${new Date(s.updated_at ?? s.created_at).toUTCString()}</pubDate>
    </item>`,
    )
    .join("");
}

function buildReviewItems(reviews: Review[]): string {
  return reviews
    .map(
      (r) => `
    <item>
      <title>${escapeXml(r.title)}</title>
      <link>${escapeXml(r.link_url || SITE_URL)}</link>
      <description>${escapeXml(r.summary)}</description>
      <pubDate>${formatRfc822(r.created_at)}</pubDate>
    </item>`,
    )
    .join("");
}

function buildRssFeed(
  config: SiteConfig | null,
  services: ServiceWithImageUrls[],
  reviews: Review[],
): string {
  const channelTitle = config?.business_name ?? "청소클라쓰";
  const channelDescription =
    config?.description ?? "전북 지역 전문 청소 서비스, 청소클라쓰";
  const channelLink = config?.site_url ?? SITE_URL;
  const lastBuildDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>${buildServiceItems(services)}${buildReviewItems(reviews)}
  </channel>
</rss>`;
}

export async function GET(): Promise<Response> {
  const [config, services, reviews] = await Promise.all([
    getSiteConfig(),
    getPublishedServicesWithImageUrls(),
    getAllPublishedReviews(),
  ]);
  const xml = buildRssFeed(config, services, reviews);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600",
    },
  });
}
