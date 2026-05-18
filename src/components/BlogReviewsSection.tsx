import { getPublishedReviews } from "@/shared/lib/home";
import { getSiteConfig } from "@/shared/lib/site-config";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import { BlogReviews } from "@/components/BlogReviews";

export async function BlogReviewsSection() {
  const [reviews, siteConfig] = await Promise.all([
    getPublishedReviews(),
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
