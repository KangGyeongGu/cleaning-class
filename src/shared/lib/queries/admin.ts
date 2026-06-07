import { createClient } from "@/shared/lib/supabase/server";

export interface AdminDashboardData {
  serviceCount: number;
  reviewCount: number;
  customerReviewCount: number;
  faqCount: number;
  priceCount: number;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const [
    serviceResult,
    reviewResult,
    customerReviewResult,
    faqResult,
    priceResult,
  ] = await Promise.all([
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase
      .from("customer_reviews")
      .select("*", { count: "exact", head: true }),
    supabase.from("faqs").select("*", { count: "exact", head: true }),
    supabase.from("price_items").select("*", { count: "exact", head: true }),
  ]);

  if (serviceResult.error) {
    console.error(
      "[getAdminDashboardData] 서비스 카운트 조회 실패:",
      serviceResult.error,
    );
  }

  if (reviewResult.error) {
    console.error(
      "[getAdminDashboardData] 블로그 리뷰 카운트 조회 실패:",
      reviewResult.error,
    );
  }

  if (customerReviewResult.error) {
    console.error(
      "[getAdminDashboardData] 고객 리뷰 카운트 조회 실패:",
      customerReviewResult.error,
    );
  }

  if (faqResult.error) {
    console.error(
      "[getAdminDashboardData] FAQ 카운트 조회 실패:",
      faqResult.error,
    );
  }

  if (priceResult.error) {
    console.error(
      "[getAdminDashboardData] 가격표 카운트 조회 실패:",
      priceResult.error,
    );
  }

  return {
    serviceCount: serviceResult.count ?? 0,
    reviewCount: reviewResult.count ?? 0,
    customerReviewCount: customerReviewResult.count ?? 0,
    faqCount: faqResult.count ?? 0,
    priceCount: priceResult.count ?? 0,
  };
}
