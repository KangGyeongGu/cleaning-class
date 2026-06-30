"use client";

import Image from "next/image";
import { deleteReview, toggleReviewPublish } from "@/shared/actions/review";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { useListRowActions } from "@/shared/lib/hooks/useListRowActions";
import { usePagedList } from "@/shared/lib/hooks/usePagedList";
import { Pagination } from "@/app/admin/components/Pagination";
import { RowActions } from "@/app/admin/components/RowActions";
import type { Review } from "@/shared/types/database";

interface ReviewListClientProps {
  reviews: (Review & { imageUrl: string })[];
}

const REVIEWS_PER_PAGE = 10;

export function ReviewListClient({
  reviews,
}: ReviewListClientProps): React.ReactElement {
  const { deletingId, togglingId, runDelete, runToggle } = useListRowActions();
  const {
    page: safePage,
    setPage: setCurrentPage,
    totalPages,
    pageItems: pagedReviews,
  } = usePagedList(reviews, REVIEWS_PER_PAGE);

  const handleDelete = (reviewId: string): Promise<void> =>
    runDelete(reviewId, () => deleteReview(reviewId), {
      confirmMessage: "정말 삭제하시겠습니까?",
      errorMessage: "삭제 중 오류가 발생했습니다.",
      logLabel: "리뷰 삭제 중 예외 발생:",
    });

  const handleTogglePublish = (
    reviewId: string,
    currentStatus: boolean,
  ): Promise<void> =>
    runToggle(reviewId, () => toggleReviewPublish(reviewId, !currentStatus), {
      errorMessage: "게시 상태 변경 중 오류가 발생했습니다.",
      logLabel: "리뷰 게시 상태 변경 중 예외 발생:",
    });

  return (
    <>
      <div className="border border-slate-200">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 p-4 md:grid">
          <div className="text-label col-span-1 text-slate-500">이미지</div>
          <div className="text-label col-span-3 text-slate-500">제목</div>
          <div className="text-label col-span-3 text-slate-500">태그</div>
          <div className="text-label col-span-1 text-center text-slate-500">
            게시
          </div>
          <div className="text-label col-span-2 text-slate-500">등록일</div>
          <div className="text-label col-span-2 text-right text-slate-500">
            작업
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {pagedReviews.map((review) => (
            <div
              key={review.id}
              role="listitem"
              className="space-y-3 p-4 md:grid md:grid-cols-12 md:items-center md:gap-4 md:space-y-0"
            >
              <div className="flex items-start gap-3 md:hidden">
                <div className="relative aspect-square h-12 w-12 shrink-0 border border-slate-200">
                  <Image
                    src={review.imageUrl}
                    alt={review.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-slate-900">
                    {review.title}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PublishToggle
                        isPublished={review.is_published}
                        isLoading={togglingId === review.id}
                        onToggle={() =>
                          handleTogglePublish(review.id, review.is_published)
                        }
                      />
                      <span className="text-[10px] text-slate-400">
                        {new Date(review.created_at).toLocaleDateString(
                          "ko-KR",
                        )}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <RowActions
                        variant="mobile"
                        editHref={`/admin/reviews/${review.id}/edit`}
                        editLabel="리뷰 수정"
                        deleteLabel="리뷰 삭제"
                        onDelete={() => handleDelete(review.id)}
                        isDeleting={deletingId === review.id}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:col-span-1 md:block">
                <div className="relative aspect-square h-16 w-16 border border-slate-200">
                  <Image
                    src={review.imageUrl}
                    alt={review.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </div>

              <div className="hidden md:col-span-3 md:block">
                <p className="line-clamp-2 text-sm font-bold text-slate-900">
                  {review.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {review.summary}
                </p>
              </div>

              <div className="hidden md:col-span-3 md:block">
                <div className="flex flex-wrap gap-1">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 px-2 py-1 text-xs text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hidden md:col-span-1 md:block md:text-center">
                <PublishToggle
                  isPublished={review.is_published}
                  isLoading={togglingId === review.id}
                  onToggle={() =>
                    handleTogglePublish(review.id, review.is_published)
                  }
                  size={14}
                  label={review.is_published ? "게시" : "비공개"}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
                />
              </div>

              <div className="hidden md:col-span-2 md:block">
                <span className="text-xs text-slate-500">
                  {new Date(review.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>

              <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
                <RowActions
                  variant="desktop"
                  editHref={`/admin/reviews/${review.id}/edit`}
                  editLabel="리뷰 수정"
                  deleteLabel="리뷰 삭제"
                  onDelete={() => handleDelete(review.id)}
                  isDeleting={deletingId === review.id}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
