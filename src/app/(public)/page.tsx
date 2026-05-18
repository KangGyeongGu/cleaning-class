import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { WorkProcessSection } from "@/components/WorkProcessSection";
import { BlogReviewsSection } from "@/components/BlogReviewsSection";
import { CustomerReviewsSection } from "@/components/CustomerReviewsSection";
import { buildDescription } from "@/shared/lib/format";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const title =
    "전주 청소·이사업체 청소클라쓰 | 전북 전주 전문 청소·이사 서비스";
  const description = buildDescription();

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

function ServicesSkeleton() {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-7xl animate-pulse px-6">
        <div className="mx-auto mb-8 h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-64 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-7xl animate-pulse px-6">
        <div className="mx-auto mb-8 h-8 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function CustomerReviewsSkeleton() {
  return (
    <div className="py-16 md:py-32">
      <div className="mx-auto max-w-2xl animate-pulse px-6">
        <div className="mb-8 h-8 w-32 rounded bg-slate-200" />
        <div className="space-y-4">
          <div className="h-24 rounded bg-slate-200" />
          <div className="h-24 rounded bg-slate-200" />
          <div className="h-24 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <Hero />

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
