"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import {
  deleteCustomerReview,
  toggleCustomerReviewPublish,
} from "@/shared/actions/customer-review";
import { Pagination } from "@/app/admin/components/Pagination";
import type { CustomerReviewRow } from "@/shared/types/database";

const REVIEWS_PER_PAGE = 10;

function StarDisplay({ rating }: { rating: number }): React.ReactElement {
  return (
    <span className="flex items-center gap-0.5" aria-label={`별점 ${rating}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={`star-${i}`}
          className={`h-3.5 w-3.5 ${i < rating ? "text-slate-900" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR");
}

interface CustomerReviewsListProps {
  reviews: CustomerReviewRow[];
}

export function CustomerReviewsList({
  reviews,
}: CustomerReviewsListProps): React.ReactElement {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pagedReviews = useMemo(
    () =>
      reviews.slice(
        (safePage - 1) * REVIEWS_PER_PAGE,
        safePage * REVIEWS_PER_PAGE,
      ),
    [reviews, safePage],
  );

  function handleDelete(reviewId: string): void {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    setDeletingId(reviewId);
    startTransition(async () => {
      try {
        await deleteCustomerReview(reviewId);
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    });
  }

  function handleTogglePublish(reviewId: string, currentStatus: boolean): void {
    setTogglingId(reviewId);
    startTransition(async () => {
      try {
        await toggleCustomerReviewPublish(reviewId, !currentStatus);
        router.refresh();
      } finally {
        setTogglingId(null);
      }
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="border border-slate-200 p-12 text-center">
        <p className="font-light text-slate-500">
          아직 제출된 고객 리뷰가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-slate-200">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 p-4 md:grid">
          <div className="text-label col-span-2 text-slate-500">별점</div>
          <div className="text-label col-span-2 text-slate-500">서비스</div>
          <div className="text-label col-span-4 text-slate-500">내용</div>
          <div className="text-label col-span-1 text-center text-slate-500">
            공개
          </div>
          <div className="text-label col-span-2 text-slate-500">등록일</div>
          <div className="text-label col-span-1 text-right text-slate-500">
            삭제
          </div>
        </div>

        <ul role="list" className="divide-y divide-slate-200">
          {pagedReviews.map((review) => (
            <li
              key={review.id}
              className="space-y-3 p-4 md:grid md:grid-cols-12 md:items-center md:gap-4 md:space-y-0"
            >
              <div className="flex items-start gap-3 md:hidden">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-slate-400">
                      {review.rating}점
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700">
                    {review.comment}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublish(review.id, review.is_published)
                        }
                        disabled={togglingId === review.id}
                        className="inline-flex items-center gap-1 text-xs text-slate-500"
                      >
                        {togglingId === review.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : review.is_published ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {review.service_type ?? "-"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="rounded border border-slate-200 p-2 text-slate-500 disabled:opacity-50"
                      >
                        {deletingId === review.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:col-span-2 md:flex md:items-center md:gap-2">
                <StarDisplay rating={review.rating} />
                <span className="text-xs font-light text-slate-400">
                  {review.rating}
                </span>
              </div>

              <div className="hidden md:col-span-2 md:block">
                <span className="text-xs text-slate-500">
                  {review.service_type ?? "-"}
                </span>
              </div>

              <div className="hidden md:col-span-4 md:block">
                <p className="line-clamp-2 text-sm font-light text-slate-700">
                  {review.comment}
                </p>
              </div>

              <div className="hidden md:col-span-1 md:block md:text-center">
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePublish(review.id, review.is_published)
                  }
                  disabled={togglingId === review.id}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
                >
                  {togglingId === review.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : review.is_published ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}
                  {review.is_published ? "공개" : "비공개"}
                </button>
              </div>

              <div className="hidden md:col-span-2 md:block">
                <span className="text-xs text-slate-500">
                  {formatDate(review.created_at)}
                </span>
              </div>

              <div className="hidden md:col-span-1 md:flex md:justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                >
                  {deletingId === review.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
