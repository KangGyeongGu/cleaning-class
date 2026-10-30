"use client";

import {
  NaverBlogIcon,
  NaverCafeIcon,
  InstagramIcon,
  DaangnIcon,
} from "@/components/icons/SocialIcons";
import TrackedSnsLink, {
  type SnsClickLocation,
} from "@/components/analytics/TrackedSnsLink.client";
import {
  getSocialLinks,
  type SocialUrls,
  type SnsPlatform,
} from "@/shared/lib/pure/social-links";

const ICONS = {
  naver_blog: NaverBlogIcon,
  naver_cafe: NaverCafeIcon,
  instagram: InstagramIcon,
  daangn: DaangnIcon,
} satisfies Record<SnsPlatform, typeof NaverBlogIcon>;

const LINK_CLASSES = {
  navbar:
    "group relative inline-flex text-slate-400 transition-colors hover:text-slate-900",
  footer:
    "inline-flex min-h-11 items-center gap-2 transition-colors hover:text-slate-900 md:min-h-0",
  reviews_section:
    "inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-900",
  contact_aside:
    "inline-flex text-slate-400 transition-colors hover:text-slate-900",
} satisfies Record<SnsClickLocation, string>;

interface SocialLinksProps {
  urls?: SocialUrls | null;
  location: SnsClickLocation;
  size?: number;
  tabIndex?: number;
  onClick?: () => void;
}

export function SocialLinks({
  urls,
  location,
  size,
  tabIndex,
  onClick,
}: SocialLinksProps) {
  const iconSize = size ?? (location === "footer" ? 16 : 20);
  return getSocialLinks(urls).map(
    ({ platform, label, accessibleLabel, href }) => {
      const Icon = ICONS[platform];
      const link = (
        <TrackedSnsLink
          key={platform}
          href={href}
          platform={platform}
          location={location}
          ariaLabel={accessibleLabel}
          className={LINK_CLASSES[location]}
          tabIndex={tabIndex}
          onClick={onClick}
        >
          <span
            className="inline-flex shrink-0 items-center justify-center"
            style={{ width: iconSize, height: iconSize }}
          >
            <Icon size={iconSize} />
          </span>
          {(location === "footer" || location === "reviews_section") && label}
          {location === "navbar" && (
            <span
              aria-hidden="true"
              className="pointer-events-none invisible absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity group-focus-visible:visible group-focus-visible:opacity-100 [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100"
            >
              {accessibleLabel}
            </span>
          )}
        </TrackedSnsLink>
      );
      return location === "footer" ? <li key={platform}>{link}</li> : link;
    },
  );
}
