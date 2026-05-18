"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Review } from "@/shared/types/database";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/constants";

import { BLUR_PLACEHOLDER } from "@/shared/lib/image";
import {
  trackReviewCardClick,
  trackReviewFilter,
} from "@/shared/lib/analytics";

interface ReviewsPageClientProps {
  reviews: Review[];
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function ReviewCard({ review }: { review: Review }) {
  const rawUrl = review.link_url || null;
  const cardUrl = rawUrl && isSafeUrl(rawUrl) ? rawUrl : null;

  const inner = (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-lg">
      <div className="relative aspect-square shrink-0 overflow-hidden bg-slate-100">
        <Image
          src={getReviewImageUrl(review.image_path)}
          alt={review.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 286px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="mb-2 flex min-h-5 flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span key={tag} className="tag-pill text-xs">
              {tag}
            </span>
          ))}
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-sm leading-snug font-bold text-slate-900 transition-colors group-hover:text-slate-700">
          {review.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-xs leading-relaxed font-normal text-slate-500">
          {review.summary}
        </p>

        {cardUrl && (
          <div className="mt-auto flex justify-end" aria-hidden="true">
            <span className="text-label flex w-fit items-center gap-1.5 border-b border-transparent pb-0.5 text-slate-900 transition-all group-hover:border-slate-900">
              후기 보기 <ArrowUpRight size={12} />
            </span>
          </div>
        )}
      </div>
    </article>
  );

  if (cardUrl) {
    return (
      <a
        href={cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
        aria-label={`${review.title} — 블로그에서 보기`}
        onClick={() =>
          trackReviewCardClick({
            review_id: review.id,
            review_title: review.title,

            service_type: review.tags[0] ?? "",
            click_source: "reviews_page",
            destination_url: cardUrl,
          })
        }
      >
        {inner}
      </a>
    );
  }

  return <div className="h-full">{inner}</div>;
}

const PER_PAGE = 12;

export function ReviewsPageClient({ reviews }: ReviewsPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredReviews = activeFilter
    ? reviews.filter((r) => r.tags.includes(activeFilter))
    : reviews;

  const totalPages = Math.ceil(filteredReviews.length / PER_PAGE);
  const pagedReviews = filteredReviews.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    trackReviewFilter({
      filter_category: filter ?? "전체",
      filter_source: "reviews_page",
    });
  };

  const getPageNumbers = (): number[] => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div>
      <div
        className="scrollbar-hide mb-10 flex gap-2 overflow-x-auto"
        role="tablist"
        aria-label="서비스 유형 필터"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === null}
          onClick={() => handleFilterChange(null)}
          className={`btn-filter shrink-0 ${activeFilter === null ? "btn-filter-active" : "btn-filter-inactive"}`}
        >
          전체
        </button>
        {CLEANING_SERVICE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={activeFilter === type}
            onClick={() => handleFilterChange(type)}
            className={`btn-filter shrink-0 ${activeFilter === type ? "btn-filter-active" : "btn-filter-inactive"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm font-light text-slate-400">
            해당 카테고리의 후기가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm font-light text-slate-400">
            총 {filteredReviews.length}건
          </p>

          <ul
            ref={listRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            role="list"
          >
            {pagedReviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="페이지 탐색"
              className="mt-12 flex items-center justify-center gap-1"
            >
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="이전 페이지"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToPage(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    1
                  </button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-300">
                      …
                    </span>
                  )}
                </>
              )}

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors ${
                    page === currentPage
                      ? "bg-slate-900 font-semibold text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              ))}

              {getPageNumbers().at(-1)! < totalPages && (
                <>
                  {getPageNumbers().at(-1)! < totalPages - 1 && (
                    <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-300">
                      …
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => goToPage(totalPages)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="다음 페이지"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
