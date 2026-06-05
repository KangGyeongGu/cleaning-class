import { getAdminCustomerReviews } from "@/shared/lib/queries/customer-review";
import { CustomerReviewsList } from "@/app/admin/customer-reviews/CustomerReviewsList.client";
import type { ReviewListSort } from "@/shared/lib/schema/index";

interface CustomerReviewsListSectionProps {
  sort: ReviewListSort;
}

export async function CustomerReviewsListSection({
  sort,
}: CustomerReviewsListSectionProps): Promise<React.ReactElement> {
  const reviews = await getAdminCustomerReviews(sort === "oldest");
  return <CustomerReviewsList reviews={reviews} />;
}
