import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateBreadcrumbListJsonLd } from "@/shared/lib/domain/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { PolicyVersionSelector } from "@/components/policy/PolicyVersionSelector.client";
import { PolicyArchiveBanner } from "@/components/policy/PolicyArchiveBanner";
import {
  TERMS_VERSIONS,
  findPolicyVersion,
  getArchivedPolicyVersions,
} from "@/shared/lib/domain/policy-versions";
import { TermsV20260323 } from "@/app/(public)/policy/terms/_versions/V20260323";

export const revalidate = false;

const VERSION_COMPONENTS: Record<string, () => React.ReactElement> = {
  "2026-03-23": TermsV20260323,
};

export function generateStaticParams() {
  return getArchivedPolicyVersions(TERMS_VERSIONS).map((v) => ({
    version: v.version,
  }));
}

export const metadata: Metadata = {
  title: "이용약관 — 이전 버전",
  description: "청소클라쓰 이용약관의 이전 시행 버전",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://www.cleaningclass.co.kr/policy/terms",
  },
};

interface ArchivedTermsPageProps {
  params: Promise<{ version: string }>;
}

export default async function ArchivedTermsPage({
  params,
}: ArchivedTermsPageProps) {
  const { version } = await params;
  const policyVersion = findPolicyVersion(TERMS_VERSIONS, version);
  const Component = VERSION_COMPONENTS[version];
  if (!policyVersion || !Component) {
    notFound();
  }

  const breadcrumbJsonLd = generateBreadcrumbListJsonLd([
    { name: "홈", url: "https://www.cleaningclass.co.kr" },
    {
      name: "이용약관",
      url: "https://www.cleaningclass.co.kr/policy/terms",
    },
    {
      name: `이전 버전 (${policyVersion.effectiveFrom})`,
      url: `https://www.cleaningclass.co.kr/policy/terms/${version}`,
    },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
      <JsonLdScript data={breadcrumbJsonLd} />

      <div className="mb-10 flex justify-end">
        <PolicyVersionSelector
          versions={TERMS_VERSIONS}
          selectedVersion={version}
          basePath="/policy/terms"
        />
      </div>

      <PolicyArchiveBanner
        effectiveUntil={policyVersion.effectiveUntil ?? ""}
        currentHref="/policy/terms"
      />

      <Component />
    </article>
  );
}
