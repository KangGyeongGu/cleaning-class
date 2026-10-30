import type { SiteConfig } from "@/shared/types/database";

export const SNS_PLATFORMS = [
  "naver_blog",
  "naver_cafe",
  "instagram",
  "daangn",
] as const;

export type SnsPlatform = (typeof SNS_PLATFORMS)[number];

export const SOCIAL_LINKS = [
  {
    platform: "naver_blog",
    field: "blog_url",
    label: "블로그",
    accessibleLabel: "네이버 블로그",
  },
  {
    platform: "naver_cafe",
    field: "cafe_url",
    label: "카페",
    accessibleLabel: "네이버 카페",
  },
  {
    platform: "instagram",
    field: "instagram_url",
    label: "인스타그램",
    accessibleLabel: "인스타그램",
  },
  {
    platform: "daangn",
    field: "daangn_url",
    label: "당근",
    accessibleLabel: "당근",
  },
] as const satisfies readonly {
  platform: SnsPlatform;
  field: keyof SiteConfig;
  label: string;
  accessibleLabel: string;
}[];

export type SocialUrls = Partial<
  Pick<SiteConfig, (typeof SOCIAL_LINKS)[number]["field"]>
>;

export function getSocialLinks(urls?: SocialUrls | null) {
  return SOCIAL_LINKS.flatMap((link) => {
    const href = urls?.[link.field]?.trim();
    return href ? [{ ...link, href }] : [];
  });
}
