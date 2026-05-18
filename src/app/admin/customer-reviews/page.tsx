import type { Metadata } from "next";
import { getAdminCustomerReviews } from "@/shared/lib/queries/customer-review";
import { CustomerReviewsList } from "@/app/admin/customer-reviews/CustomerReviewsList.client";
import { CustomerReviewDescriptionSection } from "@/app/admin/customer-reviews/CustomerReviewDescriptionSection";

export const metadata: Metadata = {
  title: "고객 리뷰 관리",
  robots: { index: false, follow: false },
};

export default async function CustomerReviewsPage(): Promise<React.ReactElement> {
  const reviews = await getAdminCustomerReviews();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="md:text-heading-1 text-xl font-black">고객 리뷰 관리</h1>
      </div>

      <div className="mb-6 md:mb-8">
        <CustomerReviewDescriptionSection />
      </div>

      <CustomerReviewsList reviews={reviews} />
    </div>
  );
}
