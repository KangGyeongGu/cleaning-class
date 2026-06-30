"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { submitPublicReview } from "@/shared/actions/customer-review";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/review/StarRating";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

function AnimatedCheckIcon(): React.ReactElement {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <motion.circle
        cx={20}
        cy={20}
        r={18}
        stroke="#0f172a"
        strokeWidth={1.5}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M12 20.5l5.5 5.5L28 15"
        stroke="#0f172a"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.45 }}
      />
    </svg>
  );
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered > 0 ? hovered : value;

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label="별점 선택"
      onMouseLeave={() => setHovered(0)}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const starValue = (i + 1) * 0.5;
        const isLeft = i % 2 === 0;
        const filled = starValue <= displayRating;

        return (
          <button
            key={starValue}
            type="button"
            aria-label={`${starValue}점`}
            aria-pressed={value === starValue}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            style={{
              width: 14,
              height: 28,
              overflow: "hidden",
              display: "inline-block",
            }}
          >
            <svg
              width={28}
              height={28}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{
                marginLeft: isLeft ? 0 : -14,
              }}
            >
              <path
                d="M10 1.667l2.575 5.217 5.758.838-4.166 4.063.983 5.732L10 14.583l-5.15 2.934.983-5.732L1.667 7.722l5.758-.838L10 1.667z"
                fill={filled ? "#0f172a" : "none"}
                stroke={filled ? "#0f172a" : "#cbd5e1"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function ReviewSubmitForm() {
  const [state, formAction, isPending] = useActionState(
    submitPublicReview,
    null,
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceType, setServiceType] = useState("");

  const isSuccess = state?.success === true;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <AnimatedCheckIcon />
          <motion.p
            className="text-sm font-medium text-slate-900"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            후기가 등록되었습니다. 감사합니다!
          </motion.p>
          <motion.p
            className="text-xs text-slate-500"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.3 }}
          >
            소중한 후기는 더 나은 서비스를 만드는 데 큰 도움이 됩니다.
          </motion.p>
        </div>

        <motion.article
          className="w-full rounded-xl border border-slate-200 bg-white p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StarRating rating={rating} size={13} />
              <span className="text-xs font-bold text-slate-900 tabular-nums">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-slate-400">방금 전</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{comment}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-900">익명</span>
            {serviceType && (
              <>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-slate-400">{serviceType}</span>
              </>
            )}
          </div>
        </motion.article>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10 text-center">
        <p className="text-xs font-medium tracking-widest text-slate-400 uppercase">
          청소클라쓰
        </p>
        <h1 className="text-heading-1 mt-2">고객 리뷰</h1>
        <p className="mt-3 text-sm font-light text-slate-500">
          서비스 이용 소감을 솔직하게 남겨주세요.
        </p>
      </div>
      <div className="border border-slate-100 bg-white p-8">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="rating" value={rating} />

          <div>
            <p
              id="rating-label"
              className="mb-3 block text-sm font-medium text-slate-900"
            >
              서비스 만족도
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            </p>
            <div aria-labelledby="rating-label">
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <span className="mt-2 flex items-center text-xs text-slate-500">
                <StarRating
                  rating={rating}
                  size={12}
                  className="mr-1 inline-flex"
                />
                <span className="sr-only">선택된 별점:</span>
                {rating}점
              </span>
            )}
            {state?.errors?.rating && (
              <p className="form-error mt-1">{state.errors.rating[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="service_type"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              이용 서비스
            </label>
            <select
              id="service_type"
              name="service_type"
              className="form-input"
              defaultValue=""
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option value="" disabled>
                서비스를 선택해주세요
              </option>
              {CLEANING_SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              후기 내용
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={5}
              maxLength={500}
              required
              placeholder="서비스 이용 후기를 남겨주세요"
              className="form-input scrollbar-thin resize-none overflow-y-auto"
              onInput={(e) => setComment(e.currentTarget.value)}
            />
            <div className="mt-1 flex justify-end">
              <span className="text-xs text-slate-400">
                {comment.length}/500
              </span>
            </div>
            {state?.errors?.comment && (
              <p className="form-error">{state.errors.comment[0]}</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="full"
              loading={isPending}
              disabled={isPending || rating === 0}
            >
              {isPending ? "등록 중..." : "후기 등록하기"}
            </Button>

            {state?.error && (
              <p className="form-error mt-4 text-center">{state.error}</p>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
