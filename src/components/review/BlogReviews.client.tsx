"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Slider, { type CustomArrowProps } from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { Review } from "@/shared/types/database";
import { NaverBlogIcon } from "@/components/icons/SocialIcons";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

import { BLUR_PLACEHOLDER } from "@/shared/lib/domain/image";
import { track, currentPath } from "@/shared/lib/infra/track";

interface ReviewWithUrl extends Review {
  imageUrl: string;
}

interface BlogReviewsProps {
  reviews: ReviewWithUrl[];
  blogUrl?: string;
  instagramUrl?: string;
  reviewDescription?: string;
}

function NextArrow(props: CustomArrowProps) {
  const { onClick } = props;
  return (
    <button
      type="button"
      aria-label="다음 리뷰"
      className="btn-icon absolute top-1/2 -right-4 z-20 flex -translate-y-1/2 items-center justify-center hover:border-slate-900 hover:bg-slate-900 hover:text-white md:-right-8 lg:-right-12"
      onClick={onClick}
    >
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

function PrevArrow(props: CustomArrowProps) {
  const { onClick } = props;
  return (
    <button
      type="button"
      aria-label="이전 리뷰"
      className="btn-icon absolute top-1/2 -left-4 z-20 flex -translate-y-1/2 items-center justify-center hover:border-slate-900 hover:bg-slate-900 hover:text-white md:-left-8 lg:-left-12"
      onClick={onClick}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

function ReviewCard({ review }: { review: ReviewWithUrl }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3 aspect-square shrink-0 overflow-hidden bg-slate-200 md:mb-4">
        <Image
          src={review.imageUrl}
          alt={review.title}
          fill
          sizes="(max-width: 768px) 80vw, (max-width: 1280px) 33vw, 284px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-4 md:px-5 md:pb-6">
        <div className="mb-1 flex min-h-4 flex-wrap gap-1.5 md:mb-1.5 md:min-h-5 md:gap-2">
          {review.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
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
            More{" "}
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

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

interface ReviewSnsLinksProps {
  blogUrl?: string;
  instagramUrl?: string;
  variant: "desktop" | "mobile";
}

function ReviewSnsLinks({
  blogUrl,
  instagramUrl,
  variant,
}: ReviewSnsLinksProps): React.ReactElement | null {
  const hasBlog = !!blogUrl && blogUrl.trim() !== "";
  const hasInstagram = !!instagramUrl && instagramUrl.trim() !== "";
  if (!hasBlog && !hasInstagram) return null;

  const linkClass =
    variant === "desktop"
      ? "flex items-center gap-2 text-sm font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-900"
      : "inline-flex items-center gap-2 text-sm font-bold text-slate-900 transition-colors hover:text-slate-600";

  return (
    <>
      {hasBlog && (
        <a
          href={blogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={() =>
            track({
              event_type: "sns_click",
              event_payload: {
                sns_platform: "naver_blog",
                click_location: "reviews_section",
              },
              path: currentPath(),
            })
          }
        >
          <NaverBlogIcon size={16} /> BLOG{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
      {hasInstagram && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={() =>
            track({
              event_type: "sns_click",
              event_payload: {
                sns_platform: "instagram",
                click_location: "reviews_section",
              },
              path: currentPath(),
            })
          }
        >
          <Instagram size={16} /> INSTAGRAM{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </>
  );
}

function ReviewCardWrapper({
  review,
  blogUrl,
}: {
  review: ReviewWithUrl;
  blogUrl?: string;
}) {
  const rawUrl = review.link_url || blogUrl || null;
  const cardUrl = rawUrl && isSafeUrl(rawUrl) ? rawUrl : null;
  if (cardUrl) {
    return (
      <a
        href={cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-xl"
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
    <div className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ReviewCard review={review} />
    </div>
  );
}

export function BlogReviews({
  reviews,
  blogUrl,
  instagramUrl,
  reviewDescription,
}: BlogReviewsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<Slider>(null);
  const [, setActiveIndex] = useState(0);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.firstElementChild?.clientWidth ?? 1;
    const gap = 16;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const cleaningReviews = reviews.filter((r) =>
    r.tags.some((tag) =>
      (CLEANING_SERVICE_TYPES as readonly string[]).includes(tag),
    ),
  );

  const filteredReviews = activeFilter
    ? cleaningReviews.filter((r) => r.tags.includes(activeFilter))
    : cleaningReviews;

  const hasBlogUrl = blogUrl && blogUrl.trim() !== "";
  const hasInstagramUrl = instagramUrl && instagramUrl.trim() !== "";

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setActiveIndex(0);
    sliderRef.current?.slickGoTo(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "instant" });
    }

    track({
      event_type: "review_filter",
      event_payload: {
        filter_category: filter ?? "전체",
        filter_source: "home",
      },
      path: currentPath(),
    });
  };

  const slickSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
    ],
  };

  return (
    <section
      id="reviews"
      className="relative overflow-hidden bg-white py-16 md:py-32"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="mb-6 flex flex-col items-start justify-between md:mb-10 md:flex-row md:items-end md:px-2">
          <div>
            <h2 className="text-heading-1 mb-4">REVIEW</h2>
            <p className="text-body-sm max-w-lg tracking-wide text-slate-500 md:text-base">
              {reviewDescription ||
                "의뢰 전 업체의 작업 방식을 확인할 수 있는 후기들을 확인해보세요."}
            </p>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ReviewSnsLinks
              blogUrl={blogUrl}
              instagramUrl={instagramUrl}
              variant="desktop"
            />
          </div>
        </div>

        <div className="scrollbar-hide mb-5 flex gap-1.5 overflow-x-auto md:mb-8 md:gap-2 md:px-2">
          <button
            type="button"
            onClick={() => handleFilterChange(null)}
            className={`btn-filter shrink-0 ${activeFilter === null ? "btn-filter-active" : "btn-filter-inactive"}`}
          >
            전체
          </button>
          {CLEANING_SERVICE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFilterChange(type)}
              className={`btn-filter shrink-0 ${activeFilter === type ? "btn-filter-active" : "btn-filter-inactive"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {filteredReviews.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 md:px-2">
            <p className="text-sm font-light text-slate-500">
              해당 카테고리의 후기가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 md:hidden"
            >
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="relative w-4/5 shrink-0 snap-center md:w-11/12"
                >
                  <ReviewCardWrapper review={review} blogUrl={blogUrl} />
                </div>
              ))}
            </div>
            <div className="mt-6 text-center md:hidden">
              <Link
                href="/reviews"
                className="inline-block text-sm font-medium tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
              >
                전체 보기 →
              </Link>
            </div>

            {(hasBlogUrl || hasInstagramUrl) && (
              <div className="mt-4 flex flex-col items-center gap-3 text-center md:hidden">
                <ReviewSnsLinks
                  blogUrl={blogUrl}
                  instagramUrl={instagramUrl}
                  variant="mobile"
                />
              </div>
            )}

            <div className="relative hidden px-2 md:block">
              <Slider ref={sliderRef} {...slickSettings}>
                {filteredReviews.map((review) => (
                  <div key={review.id} className="relative h-full px-3 py-4">
                    <ReviewCardWrapper review={review} blogUrl={blogUrl} />
                  </div>
                ))}
              </Slider>
            </div>
          </>
        )}

        <div className="mt-8 hidden text-center md:block">
          <Link
            href="/reviews"
            className="inline-block text-sm font-medium tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-900"
          >
            전체 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
