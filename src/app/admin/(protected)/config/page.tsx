import type { Metadata } from "next";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { BusinessInfoCard } from "@/app/admin/(protected)/config/BusinessInfoCard.client";
import { MovingInfoCard } from "@/app/admin/(protected)/config/MovingInfoCard.client";
import { HeroImageCard } from "@/app/admin/(protected)/config/HeroImageCard.client";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "업체 정보",
  robots: { index: false, follow: false },
};

export default async function SiteConfigPage() {
  const config = await getSiteConfig();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">업체 정보</h1>
      {!config ? (
        <Card className="p-12 text-center">
          <p className="font-light text-slate-500">
            업체 정보를 불러올 수 없습니다.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <BusinessInfoCard config={config} />
          <MovingInfoCard config={config} />
          <HeroImageCard config={config} />
        </div>
      )}
    </div>
  );
}
