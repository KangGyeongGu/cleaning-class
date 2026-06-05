import { createClient } from "@/shared/lib/supabase/server";
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
