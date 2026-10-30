import { ManagementPage } from "@/app/admin/components/ManagementPage";
import Link from "next/link";
import { ArrowDownNarrowWide, ArrowUpWideNarrow } from "lucide-react";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { ReviewListSection } from "@/app/admin/(protected)/reviews/ReviewListSection";
import { updateReviewDescription } from "@/shared/actions/site-config";
import { reviewListSortSchema } from "@/shared/lib/schema/index";

interface ReviewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReviewsPage({
  searchParams,
}: ReviewsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const sort = reviewListSortSchema.parse(params.sort);

  const sortLinkBase =
    "inline-flex items-center gap-1.5 text-xs font-bold transition-colors md:text-sm";
  const activeClass = "text-slate-900";
  const inactiveClass = "text-slate-400 hover:text-slate-600";

  return (
    <ManagementPage
      section="reviews"
      active="/admin/reviews"
      createHref="/admin/reviews/new"
      description={
        <AdminDescriptionSection
          label="작업 사례 영역 안내 문구"
          field="review_description"
          placeholder="작업 사례 섹션 안내 문구를 입력하세요"
          emptyText="작업 사례 섹션 안내 문구가 없습니다."
          onSave={updateReviewDescription}
        />
      }
    >
      <nav
        aria-label="작업 사례 정렬"
        className="mb-3 flex items-center justify-end gap-4"
      >
        <Link
          href="/admin/reviews?sort=latest"
          className={`${sortLinkBase} ${sort === "latest" ? activeClass : inactiveClass}`}
          aria-current={sort === "latest" ? "page" : undefined}
        >
          <ArrowDownNarrowWide size={14} />
          최신순
        </Link>
        <Link
          href="/admin/reviews?sort=oldest"
          className={`${sortLinkBase} ${sort === "oldest" ? activeClass : inactiveClass}`}
          aria-current={sort === "oldest" ? "page" : undefined}
        >
          <ArrowUpWideNarrow size={14} />
          오래된순
        </Link>
      </nav>

      <ReviewListSection sort={sort} />
    </ManagementPage>
  );
}
