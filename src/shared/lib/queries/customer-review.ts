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
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("customer_reviews")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPublishedCustomerReviews] DB error:", error);
      return [];
    }

    return (data as CustomerReviewRow[] | null) ?? [];
  } catch (err) {
    console.error("[getPublishedCustomerReviews] Unexpected error:", err);
    return [];
  }
}
