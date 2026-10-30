import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import {
  CLEANING_SERVICE_TYPES,
  HOME_REVIEW_LIMIT,
} from "@/shared/lib/pure/constants";
import type { Review } from "@/shared/types/database";

export interface ReviewWithImageUrl extends Review {
  imageUrl: string;
}

export async function getReviews(
  ascending = false,
): Promise<ReviewWithImageUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending });

  if (error) {
    console.error("[getReviews] 리뷰 목록 조회 실패:", error);
    return [];
  }

  return ((data as Review[]) ?? []).map((review) => ({
    ...review,
    imageUrl: getReviewImageUrl(review.image_path),
  }));
}

export interface HomeReviewData {
  reviews: Review[];
  counts: Record<string, number | null>;
}

export async function getHomeReviewData(): Promise<HomeReviewData> {
  try {
    const supabase = createStaticClient();
    const [results, total] = await Promise.all([
      Promise.all(
        CLEANING_SERVICE_TYPES.map(async (type) => {
          const result = await supabase
            .from("reviews")
            .select("*", { count: "exact" })
            .eq("is_published", true)
            .contains("tags", [type])
            .order("created_at", { ascending: false })
            .limit(HOME_REVIEW_LIMIT);
          return { type, ...result };
        }),
      ),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .overlaps("tags", [...CLEANING_SERVICE_TYPES]),
    ]);

    const counts: HomeReviewData["counts"] = {
      all: total.error ? null : (total.count ?? null),
    };
    if (total.error)
      console.error("[getHomeReviewData] Count error:", total.error);
    const seen = new Set<string>();
    const reviews: Review[] = [];
    for (const { type, data, count, error } of results) {
      counts[type] = error ? null : (count ?? null);
      if (error) {
        console.error("[getHomeReviewData] DB error:", error);
        continue;
      }
      for (const review of (data as Review[] | null) ?? []) {
        if (!seen.has(review.id)) {
          seen.add(review.id);
          reviews.push(review);
        }
      }
    }
    reviews.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return { reviews, counts };
  } catch (err) {
    console.error("[getHomeReviewData] Unexpected error:", err);
    return { reviews: [], counts: { all: null } };
  }
}

export async function getAllPublishedReviews(): Promise<Review[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getAllPublishedReviews] DB error:", error);
      return [];
    }

    return (data as Review[] | null) ?? [];
  } catch (err) {
    console.error("[getAllPublishedReviews] Unexpected error:", err);
    return [];
  }
}

export async function getReviewById(
  id: string,
): Promise<ReviewWithImageUrl | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error) {
      console.error(`[getReviewById] 리뷰 조회 실패 (id=${id}):`, error);
    }
    return null;
  }

  const review = data as Review;
  return {
    ...review,
    imageUrl: getReviewImageUrl(review.image_path),
  };
}
