"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { getUser } from "@/shared/lib/supabase/auth";
import {
  siteConfigFormSchema,
  movingSiteConfigSchema,
} from "@/shared/lib/schema";
import type { SiteConfigUpdate } from "@/shared/types/database";
import { uploadImage, deleteImage } from "@/shared/lib/supabase/storage-server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REVALIDATE_PATHS = ["/", "/admin/config"] as const;

function revalidateSiteConfigPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

const FIELD_REVALIDATE_MAP: Record<string, readonly string[]> = {
  customer_review_description: ["/", "/admin/customer-reviews"],
  faq_description: ["/help", "/admin/faq"],
  price_description: ["/price", "/admin/price"],
  review_description: ["/reviews", "/admin/reviews"],
  service_description: ["/services", "/admin/services"],
};

async function updateSiteConfigField(
  field:
    | "customer_review_description"
    | "faq_description"
    | "price_description"
    | "review_description"
    | "service_description",
  value: string,
) {
  try {
    await getUser();

    const supabase = await createClient();
    const { data: current, error: fetchError } = await supabase
      .from("site_config")
      .select("id")
      .limit(1)
      .single<{ id: string }>();

    if (fetchError) {
      console.error("updateSiteConfigField fetch error", { field }, fetchError);
      return {
        success: false,
        error: "설정 처리 중 오류가 발생했습니다.",
      };
    }
    if (!current) {
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    const { error } = await supabase
      .from("site_config")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", current.id);

    if (error) {
      console.error("updateSiteConfigField update error", { field }, error);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    revalidatePath("/");
    const extraPaths: readonly string[] | undefined =
      FIELD_REVALIDATE_MAP[field];
    if (extraPaths) {
      for (const p of extraPaths) {
        revalidatePath(p);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("updateSiteConfigField error", { field }, error);
    return {
      success: false,
      error: "설정 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function updateCustomerReviewDescription(description: string) {
  return updateSiteConfigField("customer_review_description", description);
}

export async function updateFaqDescription(description: string) {
  return updateSiteConfigField("faq_description", description);
}

export async function updatePriceDescription(description: string) {
  return updateSiteConfigField("price_description", description);
}

export async function updateReviewDescription(description: string) {
  return updateSiteConfigField("review_description", description);
}

export async function updateServiceDescription(description: string) {
  return updateSiteConfigField("service_description", description);
}

export async function updateSiteConfig(prevState: unknown, formData: FormData) {
  try {
    await getUser();

    const supabase = await createClient();
    const { data: current, error: fetchConfigError } = await supabase
      .from("site_config")
      .select("id, site_url, address_region, address_locality")
      .limit(1)
      .single<{
        id: string;
        site_url: string;
        address_region: string;
        address_locality: string;
      }>();

    if (fetchConfigError) {
      console.error("updateSiteConfig fetch error:", fetchConfigError);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }
    if (!current) {
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    const rawData = {
      business_name: formData.get("business_name"),
      representative: formData.get("representative") || "",
      business_registration_number:
        formData.get("business_registration_number") || "",
      phone: formData.get("phone"),
      email: formData.get("email"),
      blog_url: formData.get("blog_url") || "",
      instagram_url: formData.get("instagram_url") || "",
      daangn_url: formData.get("daangn_url") || "",
      site_url: current.site_url,
      description: formData.get("description") || "",
      address_region: current.address_region,
      address_locality: current.address_locality,
      address: formData.get("address") || "",
    };

    const validationResult = siteConfigFormSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const configData: SiteConfigUpdate = {
      ...validationResult.data,
      blog_url: validationResult.data.blog_url || "",
      instagram_url: validationResult.data.instagram_url || "",
      daangn_url: validationResult.data.daangn_url || "",
      description: validationResult.data.description || "",
      address: validationResult.data.address || "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("site_config")
      .update(configData)
      .eq("id", current.id);

    if (error) {
      console.error("updateSiteConfig update error:", error);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    revalidateSiteConfigPaths();

    return {
      success: true,
      message: "업체 정보가 수정되었습니다.",
    };
  } catch (error) {
    console.error("updateSiteConfig error:", error);
    return {
      success: false,
      error: "설정 처리 중 오류가 발생했습니다.",
    };
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

export async function updateMovingSiteConfig(
  prevState: unknown,
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
}> {
  try {
    await getUser();

    const rawData = {
      moving_representative: formData.get("moving_representative") ?? "",
      moving_phone: formData.get("moving_phone") ?? "",
      moving_business_registration_number:
        formData.get("moving_business_registration_number") ?? "",
      moving_address: formData.get("moving_address") ?? "",
    };

    const validationResult = movingSiteConfigSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const { data: current, error: fetchError } = await supabase
      .from("site_config")
      .select("id")
      .limit(1)
      .single<{ id: string }>();

    if (fetchError || !current) {
      console.error("updateMovingSiteConfig fetch error:", fetchError);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    const { error: updateError } = await supabase
      .from("site_config")
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    if (updateError) {
      console.error("updateMovingSiteConfig update error:", updateError);
      return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
    }

    revalidateSiteConfigPaths();

    return { success: true, message: "이사업체 정보가 수정되었습니다." };
  } catch (error) {
    console.error("updateMovingSiteConfig error:", error);
    return { success: false, error: "설정 처리 중 오류가 발생했습니다." };
  }
}
