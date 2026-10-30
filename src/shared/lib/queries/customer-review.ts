import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import type { CustomerReviewRow } from "@/shared/types/database";

export async function getAdminCustomerReviews(
  orderAscending = false,
): Promise<CustomerReviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_reviews")
    .select("*")
    .order("created_at", { ascending: orderAscending });

  if (error) {
    console.error("[getAdminCustomerReviews] 고객 리뷰 조회 실패:", error);
    return [];
  }

  return (data as CustomerReviewRow[] | null) ?? [];
}

export async function getPublishedCustomerReviews(): Promise<
  CustomerReviewRow[]
> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("customer_reviews")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw error;
  return (data as CustomerReviewRow[] | null) ?? [];
}

export async function getCustomerReviewStats(): Promise<{
  totalCount: number;
  avgRating: number;
}> {
  const supabase = createStaticClient();
  const ratings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const results = await Promise.all(
    ratings.map((rating) =>
      supabase
        .from("customer_reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("rating", rating),
    ),
  );
  let totalCount = 0;
  let totalRating = 0;
  for (const [index, result] of results.entries()) {
    if (result.error) throw result.error;
    if (result.count === null)
      throw new Error("고객 리뷰 집계 결과가 없습니다.");
    totalCount += result.count;
    totalRating += result.count * ratings[index];
  }
  return {
    totalCount,
    avgRating:
      totalCount === 0 ? 0 : Math.round((totalRating / totalCount) * 10) / 10,
  };
}
