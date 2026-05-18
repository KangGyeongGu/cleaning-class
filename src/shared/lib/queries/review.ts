import { createClient } from "@/shared/lib/supabase/server";
import { getReviewImageUrl } from "@/shared/lib/supabase/storage";
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
