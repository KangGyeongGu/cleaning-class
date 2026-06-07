import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedCustomerReviews } from "@/shared/lib/queries/customer-review";
import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { CustomerReviewsCarousel } from "@/components/review/CustomerReviewsCarousel.client";
import { ReviewRatingHero } from "@/components/hero/ReviewRatingHero.client";
import type { CustomerReviewRow } from "@/shared/types/database";

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "오늘";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

interface ReviewCardData {
  id: string;
  rating: number;
  comment: string;
  nickname: string;
  serviceType: string | null;
  relativeDate: string;
}

function toCardData(review: CustomerReviewRow): ReviewCardData {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    nickname: review.nickname,
    serviceType: review.service_type,
    relativeDate: formatRelativeDate(review.created_at),
  };
}

export async function CustomerReviewsSection(): Promise<React.ReactElement | null> {
  const [reviews, siteConfig] = await Promise.all([
    getPublishedCustomerReviews(),
    getSiteConfig(),
  ]);

  if (reviews.length === 0) {
    return null;
  }

  const description =
    siteConfig?.customer_review_description?.trim() ||
    "실제 의뢰인들의 솔직한 사용 후기입니다.";

  const avgRating =
    Math.round(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
    ) / 10;

  const cards = reviews.map(toCardData);

  return (
    <section
      id="customer-reviews"
      className="bg-slate-50 py-16 md:py-24"
      aria-labelledby="customer-reviews-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16">
          <h2 id="customer-reviews-heading" className="text-heading-1 mb-3">
            고객 리뷰
          </h2>
          <p className="mb-8 text-sm tracking-wide text-slate-500 md:text-base">
            {description}
          </p>

          <ReviewRatingHero avgRating={avgRating} totalCount={reviews.length} />

          <Link
            href="/review/write"
            className="mt-4 inline-flex items-center gap-0.5 text-sm text-slate-600 underline underline-offset-4 transition-colors hover:text-slate-900"
          >
            리뷰 남기러 가기 <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <CustomerReviewsCarousel cards={cards} />
    </section>
  );
}
