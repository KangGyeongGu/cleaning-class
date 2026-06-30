"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { getUser } from "@/shared/lib/supabase/auth";
import {
  siteConfigFormSchema,
  movingSiteConfigSchema,
} from "@/shared/lib/schema/index";
import type { SiteConfigUpdate } from "@/shared/types/database";

const REVALIDATE_PATHS = ["/", "/admin/config"] as const;

function revalidateSiteConfigPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

type DescriptionField =
  | "customer_review_description"
  | "faq_description"
  | "price_description"
  | "review_description"
  | "service_description";

const FIELD_REVALIDATE_MAP: Record<DescriptionField, readonly string[]> = {
  customer_review_description: ["/", "/admin/customer-reviews"],
  faq_description: ["/help", "/admin/faq"],
  price_description: ["/price", "/admin/price"],
  review_description: ["/reviews", "/admin/reviews"],
  service_description: ["/services", "/admin/services"],
};

async function updateSiteConfigField(field: DescriptionField, value: string) {
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
    for (const p of FIELD_REVALIDATE_MAP[field]) {
      revalidatePath(p);
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
