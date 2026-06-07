import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { PolicyVersionSelector } from "@/components/policy/PolicyVersionSelector.client";
import { PolicyArchiveBanner } from "@/components/policy/PolicyArchiveBanner";
import {
  PRIVACY_VERSIONS,
  findPolicyVersion,
  getArchivedPolicyVersions,
} from "@/shared/lib/domain/policy-versions";
import { PrivacyV20260323 } from "@/app/(public)/policy/privacy/_versions/V20260323";

export const revalidate = false;

const VERSION_COMPONENTS: Record<string, () => React.ReactElement> = {
  "2026-03-23": PrivacyV20260323,
};

export function generateStaticParams() {
  return getArchivedPolicyVersions(PRIVACY_VERSIONS).map((v) => ({
    version: v.version,
  }));
}

export const metadata: Metadata = {
  title: "개인정보처리방침 — 이전 버전",
  description: "청소클라쓰 개인정보처리방침의 이전 시행 버전",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://www.cleaningclass.co.kr/policy/privacy",
  },
};

interface ArchivedPrivacyPageProps {
  params: Promise<{ version: string }>;
}

export default async function ArchivedPrivacyPage({
  params,
}: ArchivedPrivacyPageProps) {
  const { version } = await params;
  const policyVersion = findPolicyVersion(PRIVACY_VERSIONS, version);
  const Component = VERSION_COMPONENTS[version];
  if (!policyVersion || !Component) {
    notFound();
  }

  const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
    { name: "홈", url: "https://www.cleaningclass.co.kr" },
    {
      name: "개인정보처리방침",
      url: "https://www.cleaningclass.co.kr/policy/privacy",
    },
    {
      name: `이전 버전 (${policyVersion.effectiveFrom})`,
      url: `https://www.cleaningclass.co.kr/policy/privacy/${version}`,
    },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="mb-10 flex justify-end">
        <PolicyVersionSelector
          versions={PRIVACY_VERSIONS}
          selectedVersion={version}
          basePath="/policy/privacy"
        />
      </div>

      <PolicyArchiveBanner
        effectiveUntil={policyVersion.effectiveUntil ?? ""}
        currentHref="/policy/privacy"
      />

      <Component />
    </article>
  );
}
