import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/shared/lib/supabase/static";
import {
  PUBLIC_REVIEWS_CACHE_TAG,
  REVIEWS_PER_PAGE,
} from "@/shared/lib/pure/review-pagination";
import type { Review } from "@/shared/types/database";

export type PublicReview = Pick<
  Review,
  "id" | "title" | "summary" | "tags" | "image_path" | "link_url"
>;

export interface ReviewPage {
  reviews: PublicReview[];
  total: number;
  page: number;
  filter: string | null;
}

const getReviewCount = unstable_cache(
  async (filter: string | null) => {
    let query = createStaticClient()
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);
    if (filter) query = query.contains("tags", [filter]);
    const { count, error } = await query;
    if (error) throw error;
    if (count === null) throw new Error("작업 사례 건수를 확인할 수 없습니다.");
    return count;
  },
  ["public-review-count"],
  { revalidate: 3600, tags: [PUBLIC_REVIEWS_CACHE_TAG] },
);

const getReviewRows = unstable_cache(
  async (filter: string | null, page: number) => {
    let query = createStaticClient()
      .from("reviews")
      .select("id, title, summary, tags, image_path, link_url")
      .eq("is_published", true);
    if (filter) query = query.contains("tags", [filter]);
    const offset = (page - 1) * REVIEWS_PER_PAGE;
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + REVIEWS_PER_PAGE - 1);
    if (error) throw error;
    return (data ?? []) as PublicReview[];
  },
  ["public-review-page"],
  { revalidate: 3600, tags: [PUBLIC_REVIEWS_CACHE_TAG] },
);

export async function getPublishedReviewPage(
  filter: string | null = null,
  requestedPage = 1,
): Promise<ReviewPage> {
  const total = await getReviewCount(filter);
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(total / REVIEWS_PER_PAGE)),
  );
  const reviews = await getReviewRows(filter, page);
  return { reviews, total, page, filter };
}
