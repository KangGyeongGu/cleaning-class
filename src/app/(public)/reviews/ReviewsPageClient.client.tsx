"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { QueryStringSync } from "@/components/common/QueryStringSync.client";
import {
  reviewQuery,
  REVIEWS_PER_PAGE,
} from "@/shared/lib/pure/review-pagination";
import type {
  ReviewPage,
  PublicReview,
} from "@/shared/lib/queries/review-page";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import {
  CLEANING_SERVICE_TYPES,
  BLUR_PLACEHOLDER,
} from "@/shared/lib/pure/constants";
import { isSafeUrl } from "@/shared/lib/pure/format";
import { ReviewCard } from "@/components/review/ReviewCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { track, currentPath } from "@/shared/lib/infra/track";

interface ReviewsPageClientProps {
  initialData: ReviewPage;
}

function ReviewItem({ review }: { review: PublicReview }) {
  const rawUrl = review.link_url || null;
  const cardUrl = rawUrl && isSafeUrl(rawUrl) ? rawUrl : null;

  const inner = (
    <ReviewCard className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-slate-400 hover:shadow-lg">
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
            <Badge key={tag} className="text-xs">
              {tag}
            </Badge>
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
              사례 보기 <ArrowUpRight size={12} />
            </span>
          </div>
        )}
      </div>
    </ReviewCard>
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
          track({
            event_type: "review_card_click",
            event_payload: {
              review_id: review.id,
              service_type: review.tags[0] ?? "",
              click_source: "reviews_page",
              destination_url: cardUrl,
            },
            path: currentPath(),
          })
        }
      >
        {inner}
      </a>
    );
  }

  return <div className="h-full">{inner}</div>;
}

export function ReviewsPageClient({ initialData }: ReviewsPageClientProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { filter: activeFilter, page: requestedPage } = reviewQuery(search);
  const [loadedKey, setLoadedKey] = useState(
    `${initialData.filter ?? ""}:${initialData.page}`,
  );
  const key = `${activeFilter ?? ""}:${requestedPage}`;
  const loading = key !== loadedKey;

  useEffect(() => {
    if (loadedKey === key) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(requestedPage) });
    if (activeFilter) params.set("filter", activeFilter);
    void fetch(`/api/reviews?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("목록 조회 실패");
        const result: ReviewPage = await response.json();
        if (controller.signal.aborted) return;
        setLoadedKey(key);
        setData(result);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [key, activeFilter, requestedPage, retry, loadedKey]);

  const totalPages = Math.max(1, Math.ceil(data.total / REVIEWS_PER_PAGE));
  const currentPage = data.page;
  const pagedReviews = data.reviews;

  const syncSearch = useCallback((value: string) => {
    setSearch(value);
    setError(false);
  }, []);

  const updateParams = useCallback(
    (next: { filter?: string | null; page?: number }) => {
      const params = new URLSearchParams(window.location.search);
      if (next.filter !== undefined) {
        if (next.filter) params.set("filter", next.filter);
        else params.delete("filter");
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set("page", String(next.page));
        else params.delete("page");
      }
      const qs = params.toString();
      window.history.pushState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
      setSearch(qs);
      setError(false);
    },
    [],
  );

  const goToPage = (page: number) => {
    updateParams({ page });
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFilterChange = (filter: string | null) => {
    updateParams({ filter, page: 1 });
    track({
      event_type: "review_filter",
      event_payload: {
        filter_category: filter ?? "전체",
        filter_source: "reviews_page",
      },
      path: currentPath(),
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
    <div aria-busy={loading && !error}>
      <Suspense>
        <QueryStringSync onChange={syncSearch} />
      </Suspense>
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 text-sm text-slate-600"
        >
          목록을 불러오지 못했습니다.
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="underline"
          >
            다시 시도
          </button>
        </div>
      )}
      <div className="scrollbar-hide mb-10 flex gap-2 overflow-x-auto">
        <Button
          variant="filter"
          size="none"
          active={activeFilter === null}
          aria-pressed={activeFilter === null}
          onClick={() => handleFilterChange(null)}
          className="shrink-0"
        >
          전체
        </Button>
        {CLEANING_SERVICE_TYPES.map((type) => (
          <Button
            key={type}
            variant="filter"
            size="none"
            active={activeFilter === type}
            aria-pressed={activeFilter === type}
            onClick={() => handleFilterChange(type)}
            className="shrink-0"
          >
            {type}
          </Button>
        ))}
      </div>

      {data.total === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm font-light text-slate-400">
            해당 카테고리의 작업 사례가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm font-light text-slate-400">
            총 {data.total}건
          </p>

          <ul
            ref={listRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            role="list"
          >
            {pagedReviews.map((review) => (
              <li key={review.id}>
                <ReviewItem review={review} />
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
                disabled={loading || currentPage === 1}
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
                disabled={loading || currentPage === totalPages}
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
