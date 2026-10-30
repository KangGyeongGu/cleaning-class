"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/shared/lib/supabase/auth";
import { createClient } from "@/shared/lib/supabase/server";

const REVALIDATE_PATHS = ["/", "/admin/config"] as const;

export async function updateHomeDescription(value: string) {
  try {
    await getUser();
    const parsed = z
      .string()
      .max(500, "메인 소개글은 500자 이하여야 합니다.")
      .safeParse(value);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("id")
      .single();
    if (error || !data) {
      console.error("updateHomeDescription fetch error:", error);
      return { success: false, error: "홈화면 정보를 불러오지 못했습니다." };
    }
    const { error: updateError } = await supabase
      .from("site_config")
      .update({
        description: parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (updateError) {
      console.error("updateHomeDescription update error:", updateError);
      return { success: false, error: "메인 소개글을 저장하지 못했습니다." };
    }
    for (const path of REVALIDATE_PATHS) {
      try {
        revalidatePath(path);
      } catch (error) {
        console.error("updateHomeDescription revalidation error:", error);
      }
    }
    return { success: true };
  } catch (error) {
    console.error("updateHomeDescription error:", error);
    return {
      success: false,
      error: "메인 소개글을 저장하지 못했습니다. 다시 시도해주세요.",
    };
  }
}
