"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { withAuthAction } from "@/shared/lib/server/with-auth-action";
import { uploadImage, deleteImage } from "@/shared/lib/supabase/storage-server";
import { serviceFormSchema } from "@/shared/lib/schema/index";
import type { ServiceInsert, ServiceUpdate } from "@/shared/types/database";

const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

const MAX_REORDER_ITEMS = 100;

const BUCKET = "service-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REVALIDATE_PATHS = ["/", "/services", "/admin/services"] as const;

function revalidateServicePaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function createServiceImpl(prevState: unknown, formData: FormData) {
  const tagsRaw = formData.get("tags");
  let parsedTags: string[] = [];
  if (tagsRaw) {
    try {
      parsedTags = JSON.parse(tagsRaw as string) as string[];
    } catch {
      parsedTags = [];
    }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    tags: parsedTags,
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: formData.get("is_published") === "true",
    image_focal_x: Number(formData.get("image_focal_x") || 50),
    image_focal_y: Number(formData.get("image_focal_y") || 50),
    image_after_focal_x: Number(formData.get("image_after_focal_x") || 50),
    image_after_focal_y: Number(formData.get("image_after_focal_y") || 50),
  };

  const validationResult = serviceFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const imageFile = formData.get("image") as File | null;
  if (!imageFile || imageFile.size === 0) {
    return { success: false, error: "Before 이미지를 선택해주세요." };
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "이미지 파일 크기는 10MB 이하여야 합니다.",
    };
  }

  const imagePath = await uploadImage(BUCKET, imageFile);
  const uploadedPaths: string[] = [imagePath];

  const cleanupUploaded = async (): Promise<void> => {
    for (const path of uploadedPaths) {
      try {
        await deleteImage(BUCKET, path);
      } catch (rollbackErr) {
        console.error("createService: image rollback failed:", rollbackErr);
      }
    }
  };

  let imageAfterPath = "";
  let detailImagePath = "";
  let detailAfterImagePath = "";

  try {
    const imageAfterFile = formData.get("image_after") as File | null;
    if (imageAfterFile && imageAfterFile.size > 0) {
      if (imageAfterFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "After 이미지 파일 크기는 10MB 이하여야 합니다.",
        };
      }
      imageAfterPath = await uploadImage(BUCKET, imageAfterFile);
      uploadedPaths.push(imageAfterPath);
    }

    const detailImageFile = formData.get("detail_image") as File | null;
    if (detailImageFile && detailImageFile.size > 0) {
      if (detailImageFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "상세 Before 이미지 크기는 10MB 이하여야 합니다.",
        };
      }
      detailImagePath = await uploadImage(BUCKET, detailImageFile);
      uploadedPaths.push(detailImagePath);
    }

    const detailAfterImageFile = formData.get(
      "detail_image_after",
    ) as File | null;
    if (detailAfterImageFile && detailAfterImageFile.size > 0) {
      if (detailAfterImageFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "상세 After 이미지 크기는 10MB 이하여야 합니다.",
        };
      }
      detailAfterImagePath = await uploadImage(BUCKET, detailAfterImageFile);
      uploadedPaths.push(detailAfterImagePath);
    }
  } catch (uploadErr) {
    console.error("createService image upload error:", uploadErr);
    await cleanupUploaded();
    return { success: false, error: "서비스 등록 중 오류가 발생했습니다." };
  }

  const supabase = await createClient();
  const serviceData: ServiceInsert = {
    ...validationResult.data,
    image_path: imagePath,
    image_after_path: imageAfterPath,
    detail_image_path: detailImagePath,
    detail_image_after_path: detailAfterImagePath,
  };

  const { error } = await supabase.from("services").insert(serviceData);

  if (error) {
    console.error("createService DB error:", error);
    await cleanupUploaded();
    return { success: false, error: "서비스 등록 중 오류가 발생했습니다." };
  }

  revalidateServicePaths();

  return {
    success: true,
    message: "서비스가 등록되었습니다.",
  };
}

export const createService = withAuthAction(createServiceImpl);

async function updateServiceImpl(
  serviceId: string,
  prevState: unknown,
  formData: FormData,
) {
  if (!uuidSchema.safeParse(serviceId).success) {
    return { success: false, error: "올바른 서비스 ID가 아닙니다." };
  }

  const tagsRaw = formData.get("tags");
  let parsedTags: string[] = [];
  if (tagsRaw) {
    try {
      parsedTags = JSON.parse(tagsRaw as string) as string[];
    } catch {
      parsedTags = [];
    }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    tags: parsedTags,
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: formData.get("is_published") === "true",
    image_focal_x: Number(formData.get("image_focal_x") || 50),
    image_focal_y: Number(formData.get("image_focal_y") || 50),
    image_after_focal_x: Number(formData.get("image_after_focal_x") || 50),
    image_after_focal_y: Number(formData.get("image_after_focal_y") || 50),
  };

  const validationResult = serviceFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: existingService, error: fetchError } = await supabase
    .from("services")
    .select(
      "image_path, image_after_path, detail_image_path, detail_image_after_path",
    )
    .eq("id", serviceId)
    .single();

  if (fetchError || !existingService) {
    console.error("updateService fetch error:", fetchError);
    return { success: false, error: "서비스 수정 중 오류가 발생했습니다." };
  }

  const existing = existingService as {
    image_path: string;
    image_after_path: string;
    detail_image_path: string;
    detail_image_after_path: string;
  };

  const newlyUploaded: string[] = [];
  const cleanupUploaded = async (): Promise<void> => {
    for (const path of newlyUploaded) {
      try {
        await deleteImage(BUCKET, path);
      } catch (rollbackErr) {
        console.error("updateService: image rollback failed:", rollbackErr);
      }
    }
  };

  let newImagePath = existing.image_path;
  let newImageAfterPath = existing.image_after_path;
  let newDetailImagePath = existing.detail_image_path;
  let newDetailAfterImagePath = existing.detail_image_after_path;

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "이미지 파일 크기는 10MB 이하여야 합니다.",
      };
    }
    newImagePath = await uploadImage(BUCKET, imageFile);
    newlyUploaded.push(newImagePath);
  }

  try {
    const imageAfterFile = formData.get("image_after") as File | null;
    if (imageAfterFile && imageAfterFile.size > 0) {
      if (imageAfterFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "After 이미지 파일 크기는 10MB 이하여야 합니다.",
        };
      }
      newImageAfterPath = await uploadImage(BUCKET, imageAfterFile);
      newlyUploaded.push(newImageAfterPath);
    }

    const detailImageFile = formData.get("detail_image") as File | null;
    if (detailImageFile && detailImageFile.size > 0) {
      if (detailImageFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "상세 Before 이미지 크기는 10MB 이하여야 합니다.",
        };
      }
      newDetailImagePath = await uploadImage(BUCKET, detailImageFile);
      newlyUploaded.push(newDetailImagePath);
    }

    const detailAfterImageFile = formData.get(
      "detail_image_after",
    ) as File | null;
    if (detailAfterImageFile && detailAfterImageFile.size > 0) {
      if (detailAfterImageFile.size > MAX_FILE_SIZE) {
        await cleanupUploaded();
        return {
          success: false,
          error: "상세 After 이미지 크기는 10MB 이하여야 합니다.",
        };
      }
      newDetailAfterImagePath = await uploadImage(BUCKET, detailAfterImageFile);
      newlyUploaded.push(newDetailAfterImagePath);
    }
  } catch (uploadErr) {
    console.error("updateService image upload error:", uploadErr);
    await cleanupUploaded();
    return { success: false, error: "서비스 수정 중 오류가 발생했습니다." };
  }

  const serviceData: ServiceUpdate = {
    ...validationResult.data,
    image_path: newImagePath,
    image_after_path: newImageAfterPath,
    detail_image_path: newDetailImagePath,
    detail_image_after_path: newDetailAfterImagePath,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("services")
    .update(serviceData)
    .eq("id", serviceId);

  if (updateError) {
    console.error("updateService DB error:", updateError);
    await cleanupUploaded();
    return { success: false, error: "서비스 수정 중 오류가 발생했습니다." };
  }

  revalidateServicePaths();

  const oldPaths: Array<{ oldPath: string; newPath: string }> = [
    { oldPath: existing.image_path, newPath: newImagePath },
    { oldPath: existing.image_after_path, newPath: newImageAfterPath },
    { oldPath: existing.detail_image_path, newPath: newDetailImagePath },
    {
      oldPath: existing.detail_image_after_path,
      newPath: newDetailAfterImagePath,
    },
  ];
  for (const { oldPath, newPath } of oldPaths) {
    if (oldPath && newPath !== oldPath) {
      try {
        await deleteImage(BUCKET, oldPath);
      } catch (err) {
        console.error("updateService: old image cleanup failed:", err);
      }
    }
  }

  return {
    success: true,
    message: "서비스가 수정되었습니다.",
  };
}

export const updateService = withAuthAction(updateServiceImpl);

async function deleteServiceImpl(serviceId: string) {
  if (!uuidSchema.safeParse(serviceId).success) {
    return { success: false, error: "올바른 서비스 ID가 아닙니다." };
  }

  const supabase = await createClient();

  const { data: existingService, error: fetchError } = await supabase
    .from("services")
    .select(
      "image_path, image_after_path, detail_image_path, detail_image_after_path",
    )
    .eq("id", serviceId)
    .single();

  if (fetchError || !existingService) {
    console.error("deleteService fetch error:", fetchError);
    return { success: false, error: "서비스 삭제 중 오류가 발생했습니다." };
  }

  const existing = existingService as {
    image_path: string;
    image_after_path: string;
    detail_image_path: string;
    detail_image_after_path: string;
  };

  const { error: deleteError } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (deleteError) {
    console.error("deleteService DB error:", deleteError);
    return { success: false, error: "서비스 삭제 중 오류가 발생했습니다." };
  }

  const pathsToClean = [
    existing.image_path,
    existing.image_after_path,
    existing.detail_image_path,
    existing.detail_image_after_path,
  ].filter(Boolean);
  for (const path of pathsToClean) {
    try {
      await deleteImage(BUCKET, path);
    } catch (err) {
      console.error("deleteService: image cleanup failed:", err);
    }
  }

  revalidateServicePaths();

  return {
    success: true,
    message: "서비스가 삭제되었습니다.",
  };
}

export const deleteService = withAuthAction(deleteServiceImpl);

async function toggleServicePublishImpl(
  serviceId: string,
  isPublished: boolean,
) {
  if (!uuidSchema.safeParse(serviceId).success) {
    return { success: false, error: "올바른 서비스 ID가 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) {
    console.error("toggleServicePublish DB error:", error);
    return {
      success: false,
      error: "게시 상태 변경 중 오류가 발생했습니다.",
    };
  }

  revalidateServicePaths();

  return {
    success: true,
    message: `서비스가 ${isPublished ? "게시" : "비공개"}되었습니다.`,
  };
}

export const toggleServicePublish = withAuthAction(toggleServicePublishImpl);

async function reorderServicesImpl(
  orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
  if (orderedIds.length > MAX_REORDER_ITEMS) {
    return { success: false, error: "순서 변경 항목이 너무 많습니다." };
  }
  for (const id of orderedIds) {
    if (!uuidSchema.safeParse(id).success) {
      return { success: false, error: "올바른 서비스 ID가 아닙니다." };
    }
  }

  const supabase = await createClient();

  const items = orderedIds.map((id, i) => ({ id, order: i }));

  const { error } = await supabase.rpc("reorder_services", { items });
  if (error) {
    console.error("reorderServices DB error:", error);
    return { success: false, error: "순서 변경 중 오류가 발생했습니다." };
  }

  revalidateServicePaths();

  return { success: true };
}

export const reorderServices = withAuthAction(reorderServicesImpl);
