"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { withAuthAction } from "@/shared/lib/server/with-auth-action";
import { publicReviewFormSchema } from "@/shared/lib/schema/index";
import { checkRateLimit } from "@/shared/lib/server/rate-limit";

const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

const REVALIDATE_PATHS = ["/", "/admin/customer-reviews"] as const;
const REVIEW_RATE_LIMIT = 5;
const REVIEW_RATE_WINDOW_MS = 60_000;

function revalidateCustomerReviewPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function deleteCustomerReviewImpl(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!uuidSchema.safeParse(reviewId).success) {
    return { success: false, error: "올바른 리뷰 ID가 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    console.error("[deleteCustomerReview] DB error:", error);
    return { success: false, error: "리뷰 삭제 중 오류가 발생했습니다." };
  }

  revalidateCustomerReviewPaths();
  return { success: true };
}

export const deleteCustomerReview = withAuthAction(deleteCustomerReviewImpl);

async function toggleCustomerReviewPublishImpl(
  reviewId: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!uuidSchema.safeParse(reviewId).success) {
    return { success: false, error: "올바른 리뷰 ID가 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_reviews")
    .update({ is_published: isPublished })
    .eq("id", reviewId);

  if (error) {
    console.error("[toggleCustomerReviewPublish] DB error:", error);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  revalidateCustomerReviewPaths();
  return {
    success: true,
  };
}

export const toggleCustomerReviewPublish = withAuthAction(
  toggleCustomerReviewPublishImpl,
);

export async function submitPublicReview(
  prevState: unknown,
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}> {
  try {
    const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
    if (
      !checkRateLimit(`review:${ip}`, REVIEW_RATE_LIMIT, REVIEW_RATE_WINDOW_MS)
    ) {
      return { success: false, error: "잠시 후 다시 시도해주세요." };
    }

    const rawData = {
      rating: Number(formData.get("rating")),
      comment: formData.get("comment"),
      service_type: formData.get("service_type") || undefined,
    };

    const validationResult = publicReviewFormSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const { rating, comment, service_type } = validationResult.data;

    const supabase = createStaticClient();
    const { error } = await supabase.rpc("submit_public_review", {
      p_rating: rating,
      p_comment: comment,
      p_nickname: "익명",
      p_service_type: service_type ?? undefined,
    });

    if (error) {
      console.error("[submitPublicReview] RPC error:", error.message);
      return { success: false, error: "리뷰 등록 중 오류가 발생했습니다." };
    }

    revalidateCustomerReviewPaths();

    return { success: true };
  } catch (err) {
    console.error("[submitPublicReview] error:", err);
    return { success: false, error: "리뷰 등록 중 오류가 발생했습니다." };
  }
}
