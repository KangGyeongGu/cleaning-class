import type { Metadata } from "next";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { PolicyVersionSelector } from "@/components/policy/PolicyVersionSelector.client";
import {
  PRIVACY_VERSIONS,
  getCurrentPolicyVersion,
} from "@/shared/lib/domain/policy-versions";
import { PrivacyV20260607 } from "@/app/(public)/policy/privacy/_versions/V20260607";

export const revalidate = false;

const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
  { name: "홈", url: "https://www.cleaningclass.co.kr" },
  {
    name: "개인정보처리방침",
    url: "https://www.cleaningclass.co.kr/policy/privacy",
  },
]);

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "청소클라쓰 개인정보처리방침 — 수집 항목, 보유기간, 파기 절차 및 정보주체 권리 안내",
  alternates: {
    canonical: "https://www.cleaningclass.co.kr/policy/privacy",
  },
  openGraph: {
    title: "개인정보처리방침 | 청소클라쓰",
    description:
      "청소클라쓰 개인정보처리방침 — 수집 항목, 보유기간, 파기 절차 및 정보주체 권리 안내",
    url: "https://www.cleaningclass.co.kr/policy/privacy",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 개인정보처리방침",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "개인정보처리방침 | 청소클라쓰",
    description:
      "청소클라쓰 개인정보처리방침 — 수집 항목, 보유기간, 파기 절차 및 정보주체 권리 안내",
    images: ["/opengraph-image"],
  },
};

export default function PrivacyPage() {
  const current = getCurrentPolicyVersion(PRIVACY_VERSIONS);

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="mb-10 flex justify-end">
        <PolicyVersionSelector
          versions={PRIVACY_VERSIONS}
          selectedVersion={current.version}
          basePath="/policy/privacy"
        />
      </div>

      <PrivacyV20260607 />
    </article>
  );
}
