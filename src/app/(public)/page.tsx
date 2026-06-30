import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/hero/Hero";
import { PriceBanner } from "@/components/price/PriceBanner";
import { Services } from "@/components/service/Services";
import { WorkProcessSection } from "@/components/process/WorkProcessSection.client";
import { BlogReviewsSection } from "@/components/review/BlogReviewsSection";
import { CustomerReviewsSection } from "@/components/review/CustomerReviewsSection";
import { HOME_META_DESCRIPTION } from "@/shared/lib/pure/constants";
import {
  ServicesSkeleton,
  ReviewsSkeleton,
  CustomerReviewsSkeleton,
} from "@/components/common/HomeSkeletons";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title =
    "전주 청소·이사업체 청소클라쓰 | 전북 전주 전문 청소·이사 서비스";
  const description = HOME_META_DESCRIPTION;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "청소클라쓰 — 전북 전주 전문 청소·이사 서비스",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <Hero />

      <PriceBanner />

      <Suspense fallback={<ServicesSkeleton />}>
        <Services />
      </Suspense>

      <WorkProcessSection />

      <Suspense fallback={<ReviewsSkeleton />}>
        <BlogReviewsSection />
      </Suspense>

      <Suspense fallback={<CustomerReviewsSkeleton />}>
        <CustomerReviewsSection />
      </Suspense>
    </div>
  );
}
