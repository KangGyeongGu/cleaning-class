import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";

export const REVIEWS_PER_PAGE = 12;
export const PUBLIC_REVIEWS_CACHE_TAG = "public-reviews";

export function reviewQuery(search: string) {
  const params = new URLSearchParams(search);
  const filter = params.get("filter");
  const page = Number(params.get("page") ?? "1");
  return {
    filter:
      filter && (CLEANING_SERVICE_TYPES as readonly string[]).includes(filter)
        ? filter
        : null,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
