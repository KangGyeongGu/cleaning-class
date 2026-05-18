interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

const STAR_PATH =
  "M10 1.667l2.575 5.217 5.758.838-4.166 4.063.983 5.732L10 14.583l-5.15 2.934.983-5.732L1.667 7.722l5.758-.838L10 1.667z";

export function StarRating({
  rating,
  size = 16,
  className = "",
}: StarRatingProps): React.ReactElement {
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={`별점 ${rating}점 / 5점`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i;

        const fillType = diff >= 1 ? "full" : diff >= 0.5 ? "half" : "empty";
        const clipId = `half-star-${i}-${size}`;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {fillType === "half" && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="10" height="20" />
                </clipPath>
              </defs>
            )}

            {fillType !== "full" && (
              <path
                d={STAR_PATH}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {fillType === "full" && (
              <path
                d={STAR_PATH}
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {fillType === "half" && (
              <path
                d={STAR_PATH}
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#${clipId})`}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
