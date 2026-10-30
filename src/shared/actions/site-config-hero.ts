"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { getUser } from "@/shared/lib/supabase/auth";
import { uploadImage, deleteImage } from "@/shared/lib/supabase/storage-server";
import { MAX_IMAGE_UPLOAD_SIZE } from "@/shared/lib/pure/image-validation";
import {
  getHeroImages,
  heroAssetJson,
  heroAssetSchema,
  heroImagesSchema,
  heroDeviceSchema,
  heroSideSchema,
} from "@/shared/lib/domain/hero-images";

const REVALIDATE_PATHS = ["/", "/admin/config"] as const;

const requestSchema = z.object({
  device: heroDeviceSchema,
  side: heroSideSchema,
  expected: heroAssetSchema.nullable(),
});

export async function updateHeroImage(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  let uploadedPath: string | undefined;
  let canDeleteUpload = false;
  try {
    await getUser();
    const parsed = requestSchema.safeParse({
      device: formData.get("device"),
      side: formData.get("side"),
      expected: JSON.parse(String(formData.get("expected"))),
    });
    if (!parsed.success)
      return { success: false, error: "이미지 설정을 다시 확인해주세요." };
    const { device, side, expected } = parsed.data;
    const resultFile = formData.get("hero_image");
    if (!(resultFile instanceof File) || resultFile.size === 0)
      return { success: false, error: "저장할 이미지를 선택해주세요." };
    if (resultFile.size > MAX_IMAGE_UPLOAD_SIZE)
      return {
        success: false,
        error: "이미지 파일 크기는 10MB 이하여야 합니다.",
      };
    const supabase = await createClient();
    const { data: current, error } = await supabase
      .from("site_config")
      .select("*")
      .limit(1)
      .single();
    if (error || !current) {
      console.error("updateHeroImage fetch error:", error);
      return { success: false, error: "설정을 불러오지 못했습니다." };
    }
    const currentAsset = getHeroImages(current)[device][side];
    if (
      JSON.stringify(heroAssetJson(currentAsset)) !==
      JSON.stringify(heroAssetJson(expected))
    )
      return {
        success: false,
        error:
          "다른 곳에서 이미지가 변경되었습니다. 페이지를 새로고침해주세요.",
      };
    const displayPath = await uploadImage("hero-images", resultFile);
    uploadedPath = displayPath;
    let unusedPaths: string[] = [];
    let updateError: unknown;
    try {
      const response = await supabase.rpc("update_hero_image_variant", {
        p_id: current.id,
        p_device: device,
        p_side: side,
        p_expected: heroAssetJson(currentAsset),
        p_asset: heroAssetJson({
          displayPath,
          focalX: 50,
          focalY: 50,
        }),
      });
      unusedPaths = response.data ?? [];
      updateError = response.error;
    } catch (error) {
      updateError = error;
    }
    if (updateError) {
      console.error("updateHeroImage update error:", updateError);
      const check = await supabase
        .from("site_config")
        .select("hero_images")
        .eq("id", current.id)
        .single();
      const images = heroImagesSchema.safeParse(check.data?.hero_images);
      if (check.error || !images.success) {
        console.error(
          "updateHeroImage verification failed; retaining upload:",
          check.error,
        );
        return {
          success: false,
          error: "저장 결과를 확인하지 못했습니다. 페이지를 새로고침해주세요.",
        };
      }
      const referenced = Object.values(images.data).some((device) =>
        Object.values(device).some(
          (asset) => asset?.displayPath === displayPath,
        ),
      );
      canDeleteUpload = !referenced;
      if (!referenced)
        return {
          success: false,
          error:
            typeof updateError === "object" &&
            updateError !== null &&
            "code" in updateError &&
            updateError.code === "40001"
              ? "다른 곳에서 이미지가 변경되었습니다. 페이지를 새로고침해주세요."
              : "이미지를 저장하지 못했습니다. 다시 시도해주세요.",
        };
    }
    for (const path of unusedPaths) await removeUnusedImage(path);
    for (const path of REVALIDATE_PATHS) {
      try {
        revalidatePath(path);
      } catch (error) {
        console.error("updateHeroImage revalidation error:", error);
      }
    }
    return { success: true };
  } catch (error) {
    console.error("updateHeroImage error:", error);
    return {
      success: false,
      error: "이미지를 처리하거나 저장하지 못했습니다. 다시 시도해주세요.",
    };
  } finally {
    if (uploadedPath && canDeleteUpload) await removeUnusedImage(uploadedPath);
  }
}

async function removeUnusedImage(path: string) {
  try {
    await deleteImage("hero-images", path);
  } catch (error) {
    console.error("updateHeroImage cleanup error:", error);
  }
}
