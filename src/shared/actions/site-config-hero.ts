"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { getUser } from "@/shared/lib/supabase/auth";
import { uploadImage, deleteImage } from "@/shared/lib/supabase/storage-server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REVALIDATE_PATHS = ["/", "/admin/config"] as const;

function revalidateSiteConfigPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function updateHeroImage(
  prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await getUser();

    const supabase = await createClient();
    const slot = formData.get("slot") === "2" ? "2" : "1";

    const pathCol = slot === "1" ? "hero_image_path" : "hero_image_path_2";
    const focalXCol =
      slot === "1" ? "hero_image_focal_x" : "hero_image_focal_x_2";
    const focalYCol =
      slot === "1" ? "hero_image_focal_y" : "hero_image_focal_y_2";
    const slotLabel = slot === "1" ? "좌측" : "우측";

    const { data: current, error: fetchError } = await supabase
      .from("site_config")
      .select("id, hero_image_path, hero_image_path_2")
      .limit(1)
      .single<{
        id: string;
        hero_image_path: string | null;
        hero_image_path_2: string | null;
      }>();

    if (fetchError || !current) {
      console.error("updateHeroImage fetch error:", fetchError);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    const currentPath =
      slot === "1" ? current.hero_image_path : current.hero_image_path_2;
    const deleteFlag = formData.get("delete_hero_image");
    const heroImageFile = formData.get("hero_image");

    const focalX = Number(formData.get("focal_x")) || 50;
    const focalY = Number(formData.get("focal_y")) || 50;

    if (deleteFlag === "true") {
      const { error: updateError } = await supabase
        .from("site_config")
        .update({
          [pathCol]: "",
          [focalXCol]: 50,
          [focalYCol]: 50,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id);

      if (updateError) {
        console.error("updateHeroImage delete error:", updateError);
        return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
      }

      if (currentPath) {
        await deleteImage("hero-images", currentPath);
      }

      revalidateSiteConfigPaths();
      return {
        success: true,
        message: `${slotLabel} 히어로 이미지가 삭제되었습니다.`,
      };
    }

    if (!(heroImageFile instanceof File) || heroImageFile.size === 0) {
      if (currentPath) {
        const { error: updateError } = await supabase
          .from("site_config")
          .update({
            [focalXCol]: focalX,
            [focalYCol]: focalY,
            updated_at: new Date().toISOString(),
          })
          .eq("id", current.id);

        if (updateError) {
          console.error("updateHeroImage focal update error:", updateError);
          return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
        }

        revalidateSiteConfigPaths();
        return {
          success: true,
          message: `${slotLabel} 표시 영역이 업데이트되었습니다.`,
        };
      }
      return { success: false, error: "업로드할 이미지를 선택해주세요." };
    }

    if (heroImageFile instanceof File && heroImageFile.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "이미지 파일 크기는 10MB 이하여야 합니다.",
      };
    }

    const newImagePath = await uploadImage("hero-images", heroImageFile);

    const { error: updateError } = await supabase
      .from("site_config")
      .update({
        [pathCol]: newImagePath,
        [focalXCol]: focalX,
        [focalYCol]: focalY,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    if (updateError) {
      console.error("updateHeroImage DB update error:", updateError);
      await deleteImage("hero-images", newImagePath);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    if (currentPath) {
      await deleteImage("hero-images", currentPath);
    }

    revalidateSiteConfigPaths();
    return {
      success: true,
      message: `${slotLabel} 히어로 이미지가 업데이트되었습니다.`,
    };
  } catch (error) {
    console.error("updateHeroImage error:", error);
    return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
  }
}
