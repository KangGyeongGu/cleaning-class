"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import {
  deleteCustomerReview,
  toggleCustomerReviewPublish,
} from "@/shared/actions/customer-review";
import { Pagination } from "@/app/admin/components/Pagination";
import type { CustomerReviewRow } from "@/shared/types/database";

function StarDisplay({ rating }: { rating: number }) {
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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function ReviewCardMobile({ review }: { review: CustomerReviewRow }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-lg border border-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarDisplay rating={review.rating} />
          <span className="text-xs text-slate-400">{review.rating}점</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await toggleCustomerReviewPublish(
                  review.id,
                  !review.is_published,
                );
                router.refresh();
              })
            }
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs text-slate-400"
          >
            {review.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>{review.is_published ? "공개" : "비공개"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
              startTransition(async () => {
                await deleteCustomerReview(review.id);
                router.refresh();
              });
            }}
            disabled={isPending}
            className="text-slate-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="mb-2 text-sm leading-relaxed text-slate-700">
        {review.comment}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{review.service_type ?? "-"}</span>
        <span>{formatDate(review.created_at)}</span>
      </div>
    </div>
  );
}

function ReviewRowDesktop({ review }: { review: CustomerReviewRow }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <StarDisplay rating={review.rating} />
          <span className="text-xs font-light text-slate-400">
            {review.rating}점
          </span>
        </div>
      </td>
      <td className="py-3 pr-4 text-xs text-slate-400">
        {review.service_type ?? "-"}
      </td>
      <td className="py-3 pr-4 font-light text-slate-700">
        <p className="max-w-md leading-relaxed">{review.comment}</p>
      </td>
      <td className="py-3 pr-4 text-center">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await toggleCustomerReviewPublish(
                review.id,
                !review.is_published,
              );
              router.refresh();
            })
          }
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : review.is_published ? (
            <Eye size={14} />
          ) : (
            <EyeOff size={14} />
          )}
          {review.is_published ? "공개" : "비공개"}
        </button>
      </td>
      <td className="py-3 pr-4 text-sm font-light text-slate-400">
        {formatDate(review.created_at)}
      </td>
      <td className="py-3 text-right">
        <button
          type="button"
          onClick={() => {
            if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
            startTransition(async () => {
              await deleteCustomerReview(review.id);
            });
          }}
          disabled={isPending}
          className="text-slate-400 transition-colors hover:text-red-500 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </td>
    </tr>
  );
}

interface CustomerReviewsListProps {
  reviews: CustomerReviewRow[];
}

const REVIEWS_PER_PAGE = 10;

export function CustomerReviewsList({ reviews }: CustomerReviewsListProps) {
  const [reviewPage, setReviewPage] = useState(1);
  const reviewTotalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const pagedReviews = useMemo(
    () =>
      reviews.slice(
        (reviewPage - 1) * REVIEWS_PER_PAGE,
        reviewPage * REVIEWS_PER_PAGE,
      ),
    [reviews, reviewPage],
  );

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">제출된 고객 리뷰</h2>
        <p className="mt-0.5 text-xs font-light text-slate-500">
          고객이 토큰 링크를 통해 등록한 별점 리뷰 목록입니다. ({reviews.length}
          건)
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="border border-slate-100 p-8 text-center">
          <p className="text-sm font-light text-slate-400">
            아직 제출된 리뷰가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {pagedReviews.map((review) => (
              <ReviewCardMobile key={review.id} review={review} />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 text-left text-xs font-bold tracking-widest text-slate-500 uppercase">
                    별점
                  </th>
                  <th className="py-3 pr-4 text-left text-xs font-bold tracking-widest text-slate-500 uppercase">
                    서비스
                  </th>
                  <th className="py-3 pr-4 text-left text-xs font-bold tracking-widest text-slate-500 uppercase">
                    내용
                  </th>
                  <th className="py-3 pr-4 text-center text-xs font-bold tracking-widest text-slate-500 uppercase">
                    공개
                  </th>
                  <th className="py-3 pr-4 text-left text-xs font-bold tracking-widest text-slate-500 uppercase">
                    등록일
                  </th>
                  <th className="py-3 text-right text-xs font-bold tracking-widest text-slate-500 uppercase">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedReviews.map((review) => (
                  <ReviewRowDesktop key={review.id} review={review} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={reviewPage}
            totalPages={reviewTotalPages}
            onPageChange={setReviewPage}
          />
        </>
      )}
    </section>
  );
}
