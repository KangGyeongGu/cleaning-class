"use client";

import Link from "next/link";
import { track, currentPath } from "@/shared/lib/infra/track";

export type CtaButtonId =
  | "hero_quote_button"
  | "services_cleaning_contact"
  | "services_moving_contact"
  | "services_page_quote"
  | "price_page_quote"
  | "help_page_quote"
  | "navbar_contact"
  | "home_price_banner"
  | `service_card_${string}`;

interface TrackedCtaLinkProps {
  href: string;
  contentId: CtaButtonId;
  children: React.ReactNode;
  className?: string;
}

export default function TrackedCtaLink({
  href,
  contentId,
  children,
  className,
}: TrackedCtaLinkProps): React.ReactElement {
  function handleClick(): void {
    track({
      event_type: "cta_click",
      event_payload: { content_id: contentId },
      path: currentPath(),
    });
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
