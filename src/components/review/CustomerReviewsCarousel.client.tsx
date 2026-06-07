"use client";

import { useState } from "react";
import { StarRating } from "@/components/review/StarRating";

interface ReviewCardData {
  id: string;
  rating: number;
  comment: string;
  nickname: string;
  serviceType: string | null;
  relativeDate: string;
}

interface CustomerReviewsCarouselProps {
  cards: ReviewCardData[];
}

function ReviewCard({ card }: { card: ReviewCardData }): React.ReactElement {
  return (
    <article className="flex h-full min-h-40 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:border-slate-400 hover:shadow-lg md:min-h-0 md:p-4">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StarRating rating={card.rating} size={13} />
            <span className="text-xs font-bold text-slate-900 tabular-nums">
              {card.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-slate-400">{card.relativeDate}</span>
        </div>
        <p className="line-clamp-5 text-sm leading-relaxed text-slate-700">
          {card.comment}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-900">익명</span>
        {card.serviceType && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-xs text-slate-400">{card.serviceType}</span>
          </>
        )}
      </div>
    </article>
  );
}

export function CustomerReviewsCarousel({
  cards,
}: CustomerReviewsCarouselProps): React.ReactElement {
  const [isPaused, setIsPaused] = useState(false);

  const duplicated = [...cards, ...cards];

  const cardCount = cards.length;

  return (
    <div
      role="region"
      className="overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-label="고객 리뷰 슬라이더"
    >
      <div
        className="flex gap-4"
        style={{
          animation: `scroll-reviews ${cardCount * 3}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
          width: "max-content",
        }}
      >
        {duplicated.map((card, i) => (
          <div key={`${card.id}-${i}`} className="w-52 shrink-0 md:w-72">
            <ReviewCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
