"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { getUser } from "@/shared/lib/supabase/auth";
import { publicReviewFormSchema } from "@/shared/lib/schema/index";

const REVALIDATE_PATHS = ["/", "/admin/customer-reviews"] as const;

function revalidateCustomerReviewPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function deleteCustomerReview(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await getUser();

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
  } catch (err) {
    console.error("[deleteCustomerReview] error:", err);
    return { success: false, error: "리뷰 삭제 중 오류가 발생했습니다." };
  }
}

export async function toggleCustomerReviewPublish(
  reviewId: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await getUser();

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
  } catch (err) {
    console.error("[toggleCustomerReviewPublish] error:", err);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }
}

export async function submitPublicReview(
  prevState: unknown,
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}> {
  try {
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
