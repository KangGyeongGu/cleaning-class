import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownNarrowWide, ArrowUpWideNarrow } from "lucide-react";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { CustomerReviewsListSection } from "@/app/admin/(protected)/customer-reviews/CustomerReviewsListSection";
import { updateCustomerReviewDescription } from "@/shared/actions/site-config";
import { reviewListSortSchema } from "@/shared/lib/schema/index";

export const metadata: Metadata = {
  title: "고객 리뷰 관리",
  robots: { index: false, follow: false },
};

interface CustomerReviewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CustomerReviewsPage({
  searchParams,
}: CustomerReviewsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const sort = reviewListSortSchema.parse(params.sort);

  const sortLinkBase =
    "inline-flex items-center gap-1.5 text-xs font-bold transition-colors md:text-sm";
  const activeClass = "text-slate-900";
  const inactiveClass = "text-slate-400 hover:text-slate-600";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="md:text-heading-1 text-lg font-black">고객 리뷰 관리</h1>
      </div>

      <AdminDescriptionSection
        field="customer_review_description"
        placeholder="고객 리뷰 섹션 안내 문구를 입력하세요"
        emptyText="고객 리뷰 섹션 안내 문구가 없습니다."
        onSave={updateCustomerReviewDescription}
      />

      <nav
        aria-label="고객 리뷰 정렬"
        className="mb-3 flex items-center justify-end gap-4"
      >
        <Link
          href="/admin/customer-reviews?sort=latest"
          className={`${sortLinkBase} ${sort === "latest" ? activeClass : inactiveClass}`}
          aria-current={sort === "latest" ? "page" : undefined}
        >
          <ArrowDownNarrowWide size={14} />
          최신순
        </Link>
        <Link
          href="/admin/customer-reviews?sort=oldest"
          className={`${sortLinkBase} ${sort === "oldest" ? activeClass : inactiveClass}`}
          aria-current={sort === "oldest" ? "page" : undefined}
        >
          <ArrowUpWideNarrow size={14} />
          오래된순
        </Link>
      </nav>

      <CustomerReviewsListSection sort={sort} />
    </div>
  );
}
