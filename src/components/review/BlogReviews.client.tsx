"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { HomeReviewData } from "@/shared/lib/queries/review";
import type { Review } from "@/shared/types/database";
import { getSocialLinks } from "@/shared/lib/pure/social-links";
import { SocialLinks } from "@/components/social/SocialLinks.client";
import {
  CLEANING_SERVICE_TYPES,
  HOME_REVIEW_LIMIT,
  DEFAULT_REVIEW_DESCRIPTION,
  BLUR_PLACEHOLDER,
} from "@/shared/lib/pure/constants";
import { isSafeUrl } from "@/shared/lib/pure/format";
import { Badge } from "@/components/ui/Badge";
import { SlidingToggleIndicator } from "@/components/ui/SlidingToggleIndicator.client";
import { CarouselEdgeBlur } from "@/components/ui/CarouselEdgeBlur";
import { motion, useReducedMotion } from "motion/react";

import { track, currentPath } from "@/shared/lib/infra/track";

interface ReviewWithUrl extends Review {
  imageUrl: string;
}

interface BlogReviewsProps {
  reviews: ReviewWithUrl[];
  counts: HomeReviewData["counts"];
  blogUrl?: string;
  cafeUrl?: string;
  instagramUrl?: string;
  daangnUrl?: string;
  reviewDescription?: string;
}

function ReviewCard({ review }: { review: ReviewWithUrl }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3 aspect-square shrink-0 overflow-hidden bg-slate-200 md:mb-4">
        <Image
          src={review.imageUrl}
          alt={review.title}
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1280px) 33vw, 284px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-4 md:px-5 md:pb-6">
        <div className="mb-1 flex min-h-4 flex-wrap gap-1.5 md:mb-1.5 md:min-h-5 md:gap-2">
          {review.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        <h3 className="md:text-heading-3 mb-1.5 line-clamp-2 min-h-10 text-sm leading-snug font-bold text-slate-900 transition-colors group-hover:text-slate-700 md:mb-2 md:min-h-12">
          {review.title}
        </h3>

        <p className="mb-3 line-clamp-2 min-h-8 text-xs leading-relaxed font-normal text-slate-700 md:mb-4 md:min-h-10 md:text-sm">
          {review.summary}
        </p>

        <div className="mt-auto flex justify-end">
          <div className="md:text-label flex w-fit items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-900 uppercase md:gap-2">
            사례 보기{" "}
            <ArrowUpRight
              size={10}
              className="md:h-3 md:w-3"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCardWrapper({
  review,
  blogUrl,
}: {
  review: ReviewWithUrl;
  blogUrl?: string;
}) {
  const cardClassName =
    "group block h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-[translate,box-shadow,border-color] duration-300 ease-out hover:border-slate-400 motion-reduce:transition-none md:hover:-translate-y-1.5 md:hover:shadow-md motion-reduce:md:hover:translate-y-0";
  const rawUrl = review.link_url || blogUrl || null;
  const cardUrl = rawUrl && isSafeUrl(rawUrl) ? rawUrl : null;
  if (cardUrl) {
    return (
      <a
        href={cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
        onClick={() =>
          track({
            event_type: "review_card_click",
            event_payload: {
              review_id: String(review.id),
              service_type: review.tags[0] ?? "",
              click_source: "home_carousel",
              destination_url: cardUrl,
            },
            path: currentPath(),
          })
        }
      >
        <ReviewCard review={review} />
      </a>
    );
  }
  return (
    <div className={cardClassName}>
      <ReviewCard review={review} />
    </div>
  );
}

export function BlogReviews({
  reviews,
  counts,
  blogUrl,
  cafeUrl,
  instagramUrl,
  daangnUrl,
  reviewDescription,
}: BlogReviewsProps) {
  const id = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filtersContinue, setFiltersContinue] = useState(false);
  const reducedMotion = useReducedMotion();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [scrollable, setScrollable] = useState({
    previous: false,
    next: false,
  });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () => {
      const card = element.firstElementChild;
      const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
      const step = card instanceof HTMLElement ? card.offsetWidth + gap : 0;
      setActiveIndex(
        step > 0
          ? Math.min(
              element.children.length - 1,
              Math.round(element.scrollLeft / step),
            )
          : 0,
      );
      setScrollable({
        previous: element.scrollLeft > 1,
        next:
          element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [reviews, activeFilter]);

  useEffect(() => {
    const element = filterRef.current;
    if (!element) return;
    const update = () =>
      setFiltersContinue(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      );
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [reviews]);

  function scrollReviews(direction: number): void {
    const element = scrollRef.current;
    if (!element) return;
    const card = element.firstElementChild;
    if (!(card instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const visibleCards = Math.max(
      1,
      Math.round((element.clientWidth + gap) / step),
    );
    element.scrollBy({
      left: direction * step * visibleCards,
      behavior: "smooth",
    });
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const cleaningReviews = reviews.filter((r) =>
    r.tags.some((tag) =>
      (CLEANING_SERVICE_TYPES as readonly string[]).includes(tag),
    ),
  );

  const filteredReviews = (
    activeFilter
      ? cleaningReviews.filter((r) => r.tags.includes(activeFilter))
      : cleaningReviews
  ).slice(0, HOME_REVIEW_LIMIT);
  const previewImages = filteredReviews.filter((review) =>
    review.imageUrl.trim(),
  );
  const reviewCount = counts[activeFilter ?? "all"];
  const reviewsHref = activeFilter
    ? `/reviews?${new URLSearchParams({ filter: activeFilter })}`
    : "/reviews";

  const socialUrls = {
    blog_url: blogUrl,
    cafe_url: cafeUrl,
    instagram_url: instagramUrl,
    daangn_url: daangnUrl,
  };
  const hasSocialLinks = getSocialLinks(socialUrls).length > 0;

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    scrollRef.current?.scrollTo({ left: 0, behavior: "instant" });

    track({
      event_type: "review_filter",
      event_payload: {
        filter_category: filter ?? "전체",
        filter_source: "home",
      },
      path: currentPath(),
    });
  };

  return (
    <section
      id="reviews"
      className="relative overflow-hidden bg-white py-16 md:py-32"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <h2 className="text-heading-1 mb-4 text-center">
          <Link
            href={reviewsHref}
            className="transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
          >
            작업 사례
          </Link>
        </h2>
        <p className="text-body-sm text-center tracking-wide whitespace-pre-line text-slate-500 md:text-base">
          {reviewDescription?.trim() || DEFAULT_REVIEW_DESCRIPTION}
        </p>

        <div className="mt-6 mb-6 flex justify-center md:mb-8">
          <div className="relative max-w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <motion.div
              layoutScroll
              ref={filterRef}
              role="group"
              aria-label="작업 사례 종류"
              className="scrollbar-hide isolate flex max-w-full overflow-x-auto rounded-full p-1 pr-3"
            >
              {[null, ...CLEANING_SERVICE_TYPES].map((type) => (
                <button
                  key={type ?? "all"}
                  type="button"
                  aria-pressed={activeFilter === type}
                  onClick={(event) => {
                    handleFilterChange(type);
                    event.currentTarget.scrollIntoView({
                      behavior: reducedMotion ? "instant" : "smooth",
                      block: "nearest",
                      inline: "nearest",
                    });
                  }}
                  className={`relative min-h-8 shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-900 ${activeFilter === type ? "font-semibold text-slate-900" : "font-medium text-slate-500 hover:text-slate-900"}`}
                >
                  {activeFilter === type && (
                    <SlidingToggleIndicator layoutId={`${id}-selection`} />
                  )}
                  <span className="relative z-10">{type ?? "전체"}</span>
                </button>
              ))}
            </motion.div>
            {filtersContinue && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-slate-100 via-slate-100/80 to-transparent"
              />
            )}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 md:px-2">
            <p className="text-sm font-light text-slate-500">
              해당 카테고리의 작업 사례가 없습니다.
            </p>
          </div>
        ) : (
          <motion.div
            key={activeFilter ?? "all"}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="relative md:px-12"
          >
            <button
              type="button"
              aria-label="이전 작업 사례"
              disabled={!scrollable.previous}
              onClick={() => scrollReviews(-1)}
              className="absolute top-1/2 left-0 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:cursor-default disabled:opacity-30 md:flex"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="다음 작업 사례"
              disabled={!scrollable.next}
              onClick={() => scrollReviews(1)}
              className="absolute top-1/2 right-0 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:pointer-events-none disabled:invisible disabled:opacity-0 md:flex"
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
            <div className="relative">
              <div
                ref={scrollRef}
                role="region"
                aria-label="작업 사례 목록"
                className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[8%] pb-3 md:gap-6 md:px-0 md:py-4"
              >
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="relative w-full shrink-0 snap-center md:w-[calc((100%-3rem)/3)] md:snap-start xl:w-[calc((100%-4.5rem)/4)]"
                  >
                    <ReviewCardWrapper review={review} blogUrl={blogUrl} />
                  </div>
                ))}
                <div className="relative w-full shrink-0 snap-center md:w-[calc((100%-3rem)/3)] md:snap-start xl:w-[calc((100%-4.5rem)/4)]">
                  <Link
                    href={reviewsHref}
                    aria-label={`${activeFilter ?? "작업 사례"} 전체보기`}
                    className="group relative flex h-full min-h-48 flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-900 px-4 py-8 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    {previewImages.length > 0 && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 grid scale-105 grid-cols-4 grid-rows-7 gap-px transition-transform duration-700 ease-out group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                      >
                        {Array.from({ length: 28 }, (_, index) => {
                          const review =
                            previewImages[index % previewImages.length];
                          return (
                            <div
                              key={index}
                              className="relative overflow-hidden"
                            >
                              <Image
                                src={review.imageUrl}
                                alt=""
                                fill
                                sizes="(max-width: 767px) 25vw, (max-width: 1279px) 9vw, 6vw"
                                className="object-cover"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-slate-950/70 transition-colors duration-500 group-hover:bg-slate-950/55 group-focus-visible:bg-slate-950/55 motion-reduce:transition-none"
                    />
                    <span className="relative mb-1 text-[13px] leading-5 font-medium text-white">
                      {activeFilter ?? "전체"}
                    </span>
                    {typeof reviewCount === "number" && (
                      <span className="relative mb-4 text-[15px] leading-6 font-normal text-white tabular-nums">
                        총 {reviewCount.toLocaleString("ko-KR")}건
                      </span>
                    )}
                    <span className="relative text-2xl font-semibold tracking-tight">
                      전체보기
                    </span>
                    <span className="relative mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 transition-colors group-hover:border-white group-hover:bg-white group-hover:text-slate-900 group-focus-visible:border-white group-focus-visible:bg-white group-focus-visible:text-slate-900 motion-reduce:transition-none">
                      <ArrowRight size={20} aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              </div>
              <CarouselEdgeBlur width="8%" />
            </div>
            <div
              role="img"
              aria-label={`작업 사례 카드 ${filteredReviews.length + 1}개 중 ${activeIndex + 1}번째`}
              className="mt-4 flex justify-center gap-2 md:hidden"
            >
              {[...filteredReviews.map((review) => review.id), "view-all"].map(
                (id, index) => (
                  <span
                    key={id}
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${index === activeIndex ? "bg-slate-900" : "bg-slate-300"}`}
                  />
                ),
              )}
            </div>
          </motion.div>
        )}

        {hasSocialLinks && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <SocialLinks urls={socialUrls} location="reviews_section" />
          </div>
        )}
      </div>
    </section>
  );
}
