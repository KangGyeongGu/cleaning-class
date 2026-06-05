import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
import { CLEANING_SERVICE_TYPES } from "@/shared/lib/pure/constants";
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

export async function getPublishedReviewsByCleaningTypes(): Promise<Review[]> {
  try {
    const supabase = createStaticClient();
    const PER_CATEGORY = 4;

    const queries = CLEANING_SERVICE_TYPES.map((type) =>
      supabase
        .from("reviews")
        .select("*")
        .eq("is_published", true)
        .contains("tags", [type])
        .order("created_at", { ascending: false })
        .limit(PER_CATEGORY),
    );

    const results = await Promise.all(queries);

    const seen = new Set<string>();
    const reviews: Review[] = [];

    for (const { data, error } of results) {
      if (error) {
        console.error("[getPublishedReviewsByCleaningTypes] DB error:", error);
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

    return reviews;
  } catch (err) {
    console.error(
      "[getPublishedReviewsByCleaningTypes] Unexpected error:",
      err,
    );
    return [];
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
