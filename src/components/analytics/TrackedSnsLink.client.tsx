"use client";

import { track, currentPath } from "@/shared/lib/infra/track";

export type SnsPlatform = "naver_blog" | "instagram" | "daangn";
export type SnsClickLocation =
  | "navbar"
  | "footer"
  | "reviews_section"
  | "contact_aside";

interface TrackedSnsLinkProps {
  href: string;
  platform: SnsPlatform;
  location: SnsClickLocation;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function TrackedSnsLink({
  href,
  platform,
  location,
  children,
  className,
  ariaLabel,
}: TrackedSnsLinkProps): React.ReactElement {
  function handleClick(): void {
    track({
      event_type: "sns_click",
      event_payload: { sns_platform: platform, click_location: location },
      path: currentPath(),
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
