"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { withAuthAction } from "@/shared/lib/server/with-auth-action";
import { uploadImage, deleteImage } from "@/shared/lib/supabase/storage-server";
import { reviewFormSchema } from "@/shared/lib/schema/index";
import type { ReviewInsert, ReviewUpdate } from "@/shared/types/database";

const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

const BUCKET = "review-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REVALIDATE_PATHS = ["/", "/reviews", "/admin/reviews"] as const;

function revalidateReviewPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function createReviewImpl(prevState: unknown, formData: FormData) {
  let parsedTags: unknown;
  try {
    parsedTags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];
  } catch {
    return {
      success: false,
      errors: { tags: ["올바른 태그 형식이 아닙니다."] },
    };
  }

  const rawData = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    tags: parsedTags,
    link_url: formData.get("link_url") || "",
    is_published: formData.get("is_published") === "true",
  };

  const validationResult = reviewFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const imageFile = formData.get("image") as File | null;
  if (!imageFile || imageFile.size === 0) {
    return { success: false, error: "이미지를 선택해주세요." };
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return { success: false, error: "파일 크기는 10MB 이하여야 합니다" };
  }
  const imagePath = await uploadImage(BUCKET, imageFile);

  const supabase = await createClient();
  const reviewData: ReviewInsert = {
    ...validationResult.data,
    image_path: imagePath,
  };

  const { error } = await supabase.from("reviews").insert(reviewData);

  if (error) {
    await deleteImage(BUCKET, imagePath);
    console.error("createReview DB error:", error);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  revalidateReviewPaths();

  return {
    success: true,
    message: "리뷰가 등록되었습니다.",
  };
}

export const createReview = withAuthAction(createReviewImpl);

async function updateReviewImpl(
  reviewId: string,
  prevState: unknown,
  formData: FormData,
) {
  if (!uuidSchema.safeParse(reviewId).success) {
    return { success: false, error: "올바른 리뷰 ID가 아닙니다." };
  }

  let parsedTagsUpdate: unknown;
  try {
    parsedTagsUpdate = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];
  } catch {
    return {
      success: false,
      errors: { tags: ["올바른 태그 형식이 아닙니다."] },
    };
  }

  const rawData = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    tags: parsedTagsUpdate,
    link_url: formData.get("link_url") || "",
    is_published: formData.get("is_published") === "true",
  };

  const validationResult = reviewFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: existingReview, error: fetchError } = await supabase
    .from("reviews")
    .select("image_path")
    .eq("id", reviewId)
    .single();

  if (fetchError || !existingReview) {
    console.error("updateReview fetch error:", fetchError);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  const existingImagePath = (existingReview as { image_path: string })
    .image_path;

  const imageFile = formData.get("image") as File | null;
  let newImagePath = existingImagePath;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_FILE_SIZE) {
      return { success: false, error: "파일 크기는 10MB 이하여야 합니다" };
    }

    newImagePath = await uploadImage(BUCKET, imageFile);
  }

  const reviewData: ReviewUpdate = {
    ...validationResult.data,
    image_path: newImagePath,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("reviews")
    .update(reviewData)
    .eq("id", reviewId);

  if (updateError) {
    if (newImagePath !== existingImagePath) {
      await deleteImage(BUCKET, newImagePath);
    }
    console.error("updateReview DB error:", updateError);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  if (
    imageFile &&
    imageFile.size > 0 &&
    existingImagePath &&
    newImagePath !== existingImagePath
  ) {
    await deleteImage(BUCKET, existingImagePath);
  }

  revalidateReviewPaths();

  return {
    success: true,
    message: "리뷰가 수정되었습니다.",
  };
}

export const updateReview = withAuthAction(updateReviewImpl);

async function deleteReviewImpl(reviewId: string) {
  if (!uuidSchema.safeParse(reviewId).success) {
    return { success: false, error: "올바른 리뷰 ID가 아닙니다." };
  }

  const supabase = await createClient();

  const { data: existingReview, error: fetchError } = await supabase
    .from("reviews")
    .select("image_path")
    .eq("id", reviewId)
    .single();

  if (fetchError || !existingReview) {
    console.error("deleteReview fetch error:", fetchError);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  const existingImagePath = (existingReview as { image_path: string })
    .image_path;

  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (deleteError) {
    console.error("deleteReview DB error:", deleteError);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  if (existingImagePath) {
    await deleteImage(BUCKET, existingImagePath);
  }

  revalidateReviewPaths();

  return {
    success: true,
    message: "리뷰가 삭제되었습니다.",
  };
}

export const deleteReview = withAuthAction(deleteReviewImpl);

async function toggleReviewPublishImpl(reviewId: string, isPublished: boolean) {
  if (!uuidSchema.safeParse(reviewId).success) {
    return { success: false, error: "올바른 리뷰 ID가 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) {
    console.error("toggleReviewPublish DB error:", error);
    return { success: false, error: "리뷰 처리 중 오류가 발생했습니다." };
  }

  revalidateReviewPaths();

  return {
    success: true,
    message: `리뷰가 ${isPublished ? "게시" : "비공개"}되었습니다.`,
  };
}

export const toggleReviewPublish = withAuthAction(toggleReviewPublishImpl);
