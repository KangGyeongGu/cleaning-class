"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { deleteReview, toggleReviewPublish } from "@/shared/actions/review";
import { Pagination } from "@/app/admin/components/Pagination";
import type { Review } from "@/shared/types/database";

interface ReviewListClientProps {
  reviews: (Review & { imageUrl: string })[];
}

const REVIEWS_PER_PAGE = 10;

export function ReviewListClient({
  reviews,
}: ReviewListClientProps): React.ReactElement {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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

  const handleDelete = async (reviewId: string): Promise<void> => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(reviewId);
    try {
      const result = await deleteReview(reviewId);
      if (!result.success) {
        alert(result.error || "삭제 중 오류가 발생했습니다.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("리뷰 삭제 중 예외 발생:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (
    reviewId: string,
    currentStatus: boolean,
  ): Promise<void> => {
    setTogglingId(reviewId);
    try {
      const result = await toggleReviewPublish(reviewId, !currentStatus);
      if (!result.success) {
        alert(result.error || "게시 상태 변경 중 오류가 발생했습니다.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("리뷰 게시 상태 변경 중 예외 발생:", err);
      alert("게시 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setTogglingId(null);
    }
  };

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
                        {new Date(review.created_at).toLocaleDateString(
                          "ko-KR",
                        )}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/admin/reviews/${review.id}/edit`}
                        className="rounded border border-slate-200 p-2 text-slate-500"
                      >
                        <Edit size={12} />
                      </Link>
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
                  {review.is_published ? "게시" : "비공개"}
                </button>
              </div>

              <div className="hidden md:col-span-2 md:block">
                <span className="text-xs text-slate-500">
                  {new Date(review.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>

              <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
                <Link
                  href={`/admin/reviews/${review.id}/edit`}
                  className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                  <Edit size={14} />
                </Link>
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
