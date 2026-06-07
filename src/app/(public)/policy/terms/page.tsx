import type { Metadata } from "next";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { PolicyVersionSelector } from "@/components/policy/PolicyVersionSelector.client";
import {
  TERMS_VERSIONS,
  getCurrentPolicyVersion,
} from "@/shared/lib/domain/policy-versions";
import { TermsV20260607 } from "@/app/(public)/policy/terms/_versions/V20260607";

export const revalidate = false;

const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
  { name: "홈", url: "https://www.cleaningclass.co.kr" },
  {
    name: "이용약관",
    url: "https://www.cleaningclass.co.kr/policy/terms",
  },
]);

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "청소클라쓰 웹사이트 이용약관 — 서비스 이용조건, 권리의무, 면책사항 안내",
  alternates: {
    canonical: "https://www.cleaningclass.co.kr/policy/terms",
  },
  openGraph: {
    title: "이용약관 | 청소클라쓰",
    description:
      "청소클라쓰 웹사이트 이용약관 — 서비스 이용조건, 권리의무, 면책사항 안내",
    url: "https://www.cleaningclass.co.kr/policy/terms",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 이용약관",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "이용약관 | 청소클라쓰",
    description:
      "청소클라쓰 웹사이트 이용약관 — 서비스 이용조건, 권리의무, 면책사항 안내",
    images: ["/opengraph-image"],
  },
};

export default function TermsPage() {
  const current = getCurrentPolicyVersion(TERMS_VERSIONS);

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="mb-10 flex justify-end">
        <PolicyVersionSelector
          versions={TERMS_VERSIONS}
          selectedVersion={current.version}
          basePath="/policy/terms"
        />
      </div>

      <TermsV20260607 />
    </article>
  );
}
