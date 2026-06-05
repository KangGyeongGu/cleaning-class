"use client";

import { track, currentPath } from "@/shared/lib/infra/track";

export type PhoneClickLocation =
  | "mobile_bottom"
  | "hero_cta"
  | "services_section"
  | "contact_form"
  | "contact_aside"
  | "footer";

interface TrackedPhoneLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  phoneType: "cleaning" | "moving";
  location: PhoneClickLocation;
  children: React.ReactNode;
}

export default function TrackedPhoneLink({
  href,
  phoneType,
  location,
  children,
  ...rest
}: TrackedPhoneLinkProps): React.ReactElement {
  function handleClick(): void {
    track({
      event_type: "phone_click",
      event_payload: { phone_type: phoneType, click_location: location },
      path: currentPath(),
    });
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
