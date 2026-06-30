import Link from "next/link";
import { Plus, ArrowDownNarrowWide, ArrowUpWideNarrow } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="md:text-heading-1 text-lg font-black">리뷰 관리</h1>
        <Link
          href="/admin/reviews/new"
          className="btn-primary flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap md:gap-2 md:px-6 md:py-3 md:text-sm"
        >
          <Plus size={16} className="md:h-[18px] md:w-[18px]" />
          신규 등록
        </Link>
      </div>

      <AdminDescriptionSection
        field="review_description"
        placeholder="리뷰 섹션 안내 문구를 입력하세요"
        emptyText="리뷰 섹션 안내 문구가 없습니다."
        onSave={updateReviewDescription}
      />

      <nav
        aria-label="리뷰 정렬"
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
    </div>
  );
}
