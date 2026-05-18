"use client";

import Link from "next/link";
import { trackSelectContent } from "@/shared/lib/analytics";
import type { CtaButtonId } from "@/shared/lib/analytics";

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
    trackSelectContent({
      content_type: "cta_button",
      content_id: contentId,
    });
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
