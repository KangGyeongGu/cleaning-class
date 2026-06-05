import { getPublishedReviewsByCleaningTypes } from "@/shared/lib/queries/review";
import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import { BlogReviews } from "@/components/review/BlogReviews.client";

export async function BlogReviewsSection() {
  const [reviews, siteConfig] = await Promise.all([
    getPublishedReviewsByCleaningTypes(),
    getSiteConfig(),
  ]);

  const reviewsWithUrls = reviews.map((r) => ({
    ...r,
    imageUrl: getReviewImageUrl(r.image_path),
  }));

  return (
    <BlogReviews
      reviews={reviewsWithUrls}
      blogUrl={siteConfig?.blog_url ?? ""}
      instagramUrl={siteConfig?.instagram_url ?? ""}
      reviewDescription={siteConfig?.review_description ?? undefined}
    />
  );
}
