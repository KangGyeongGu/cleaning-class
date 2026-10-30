import { getHomeReviewData } from "@/shared/lib/queries/review";
import { getSiteConfig } from "@/shared/lib/queries/site-config";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import { BlogReviews } from "@/components/review/BlogReviews.client";

export async function BlogReviewsSection() {
  const [{ reviews, counts }, siteConfig] = await Promise.all([
    getHomeReviewData(),
    getSiteConfig(),
  ]);

  const reviewsWithUrls = reviews.map((r) => ({
    ...r,
    imageUrl: getReviewImageUrl(r.image_path),
  }));

  return (
    <BlogReviews
      reviews={reviewsWithUrls}
      counts={counts}
      blogUrl={siteConfig?.blog_url ?? ""}
      cafeUrl={siteConfig?.cafe_url ?? ""}
      instagramUrl={siteConfig?.instagram_url ?? ""}
      daangnUrl={siteConfig?.daangn_url ?? ""}
      reviewDescription={siteConfig?.review_description ?? undefined}
    />
  );
}
