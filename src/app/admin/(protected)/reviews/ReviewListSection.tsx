import { getReviews } from "@/shared/lib/queries/review";
import { ReviewListClient } from "@/app/admin/(protected)/reviews/ReviewListClient.client";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ReviewListSort } from "@/shared/lib/schema/index";

interface ReviewListSectionProps {
  sort: ReviewListSort;
}

export async function ReviewListSection({
  sort,
}: ReviewListSectionProps): Promise<React.ReactElement> {
  const reviewsWithImageUrls = await getReviews(sort === "oldest");

  if (reviewsWithImageUrls.length === 0) {
    return <EmptyState message="등록된 리뷰가 없습니다." />;
  }

  return <ReviewListClient reviews={reviewsWithImageUrls} />;
}
