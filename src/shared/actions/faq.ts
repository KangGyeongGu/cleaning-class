"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { getUser } from "@/shared/lib/supabase/auth";
import { z } from "zod";
import { faqFormSchema } from "@/shared/lib/schema/index";
import type { FaqInsert, FaqUpdate } from "@/shared/types/database";

const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

function parseDisplayOrder(formData: FormData): number {
  const raw = formData.get("display_order");
  if (raw === null || raw === "") return NaN;
  return Number(raw);
}

const MAX_REORDER_ITEMS = 100;

const REVALIDATE_PATHS = ["/help", "/admin/faq"] as const;

function revalidateFaqPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function createFaq(prevState: unknown, formData: FormData) {
  try {
    await getUser();

    const rawData = {
      question: formData.get("question"),
      answer: formData.get("answer"),
      display_order: parseDisplayOrder(formData),
      is_active: formData.get("is_active") === "true",
    };

    const validationResult = faqFormSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const insertData: FaqInsert = validationResult.data;

    const { error } = await supabase.from("faqs").insert(insertData);

    if (error) {
      console.error("createFaq DB error:", error);
      return { success: false, error: "FAQ 처리 중 오류가 발생했습니다." };
    }

    revalidateFaqPaths();

    return {
      success: true,
      message: "FAQ가 등록되었습니다.",
    };
  } catch (error) {
    console.error("createFaq error:", error);
    return {
      success: false,
      error: "FAQ 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function updateFaq(
  faqId: string,
  prevState: unknown,
  formData: FormData,
) {
  try {
    await getUser();

    const idResult = uuidSchema.safeParse(faqId);
    if (!idResult.success) {
      return { success: false, error: "올바른 FAQ ID가 아닙니다." };
    }

    const rawData = {
      question: formData.get("question"),
      answer: formData.get("answer"),
      display_order: parseDisplayOrder(formData),
      is_active: formData.get("is_active") === "true",
    };

    const validationResult = faqFormSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const supabase = await createClient();
    const updateData: FaqUpdate = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("faqs")
      .update(updateData)
      .eq("id", faqId);

    if (error) {
      console.error("updateFaq DB error:", error);
      return { success: false, error: "FAQ 처리 중 오류가 발생했습니다." };
    }

    revalidateFaqPaths();

    return {
      success: true,
      message: "FAQ가 수정되었습니다.",
    };
  } catch (error) {
    console.error("updateFaq error:", error);
    return {
      success: false,
      error: "FAQ 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteFaq(
  faqId: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await getUser();

    const idResult = uuidSchema.safeParse(faqId);
    if (!idResult.success) {
      return { success: false, error: "올바른 FAQ ID가 아닙니다." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("faqs").delete().eq("id", faqId);

    if (error) {
      console.error("deleteFaq DB error:", error);
      return { success: false, error: "FAQ 처리 중 오류가 발생했습니다." };
    }

    revalidateFaqPaths();

    return {
      success: true,
      message: "FAQ가 삭제되었습니다.",
    };
  } catch (error) {
    console.error("deleteFaq error:", error);
    return {
      success: false,
      error: "FAQ 처리 중 오류가 발생했습니다.",
    };
  }
}

export async function toggleFaqActive(
  faqId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await getUser();

    const idResult = uuidSchema.safeParse(faqId);
    if (!idResult.success) {
      return { success: false, error: "올바른 FAQ ID가 아닙니다." };
    }
    const boolResult = z.boolean().safeParse(isActive);
    if (!boolResult.success) {
      return { success: false, error: "올바른 활성 상태 값이 아닙니다." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("faqs")
      .update({
        is_active: boolResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faqId);

    if (error) {
      console.error("toggleFaqActive DB error:", error);
      return { success: false, error: "FAQ 처리 중 오류가 발생했습니다." };
    }

    revalidateFaqPaths();

    return {
      success: true,
      message: `FAQ가 ${isActive ? "활성화" : "비활성화"}되었습니다.`,
    };
  } catch (error) {
    console.error("toggleFaqActive error:", error);
    return {
      success: false,
      error: "FAQ 처리 중 오류가 발생했습니다.",
    };
  }
}

interface FaqOrderItem {
  id: string;
  display_order: number;
}

export async function reorderFaqs(
  items: FaqOrderItem[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await getUser();

    if (items.length === 0) {
      return { success: true };
    }

    if (items.length > MAX_REORDER_ITEMS) {
      return { success: false, error: "순서 변경 항목이 너무 많습니다." };
    }
    const orderSchema = z.number().int().min(0);
    for (const item of items) {
      if (!uuidSchema.safeParse(item.id).success) {
        return { success: false, error: "올바른 FAQ ID가 아닙니다." };
      }
      if (!orderSchema.safeParse(item.display_order).success) {
        return { success: false, error: "올바른 순서 값이 아닙니다." };
      }
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    const results = await Promise.all(
      items.map((item) =>
        supabase
          .from("faqs")
          .update({ display_order: item.display_order, updated_at: now })
          .eq("id", item.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error("reorderFaqs DB error:", failed.error);
      return { success: false, error: "순서 변경 중 오류가 발생했습니다." };
    }

    revalidateFaqPaths();

    return { success: true };
  } catch (error) {
    console.error("reorderFaqs error:", error);
    return { success: false, error: "순서 변경 중 오류가 발생했습니다." };
  }
}
