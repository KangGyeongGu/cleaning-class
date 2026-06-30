"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { withAuthAction } from "@/shared/lib/server/with-auth-action";
import { priceItemFormSchema } from "@/shared/lib/schema/index";
import type { PriceItemInsert, PriceItemUpdate } from "@/shared/types/database";

const uuidSchema = z.string().uuid("올바른 ID 형식이 아닙니다.");

const MAX_REORDER_ITEMS = 100;

function revalidatePricePaths(): void {
  revalidatePath("/price");
  revalidatePath("/admin/price");
}

function parsePriceWon(formData: FormData): number | null {
  if (formData.get("is_variable") === "true") return null;
  const raw = formData.get("price_won");
  if (raw === null || raw === "") return Number.NaN;
  return Number(raw);
}

function parseSortOrder(formData: FormData): number {
  const raw = formData.get("sort_order");
  if (raw === null || raw === "") return NaN;
  return Number(raw);
}

interface ActionResult {
  success: boolean;
  error?: string;
  errors?: Partial<Record<string, string[]>>;
  message?: string;
}

async function createPriceItemImpl(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    price_won: parsePriceWon(formData),
    sort_order: parseSortOrder(formData),
    is_published: formData.get("is_published") === "true",
  };

  const validationResult = priceItemFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const insertData: PriceItemInsert = validationResult.data;

  const { error } = await supabase.from("price_items").insert(insertData);

  if (error) {
    console.error("[action:price] createPriceItem DB error:", error);
    return {
      success: false,
      error: "가격표 항목 처리 중 오류가 발생했습니다.",
    };
  }

  revalidatePricePaths();

  return { success: true, message: "가격표 항목이 등록되었습니다." };
}

export const createPriceItem = withAuthAction(createPriceItemImpl);

async function updatePriceItemImpl(
  id: string,
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "올바른 가격표 항목 ID가 아닙니다." };
  }

  const rawData = {
    name: formData.get("name"),
    price_won: parsePriceWon(formData),
    sort_order: parseSortOrder(formData),
    is_published: formData.get("is_published") === "true",
  };

  const validationResult = priceItemFormSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const updateData: PriceItemUpdate = {
    ...validationResult.data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("price_items")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[action:price] updatePriceItem DB error:", error);
    return {
      success: false,
      error: "가격표 항목 처리 중 오류가 발생했습니다.",
    };
  }

  revalidatePricePaths();

  return { success: true, message: "가격표 항목이 수정되었습니다." };
}

export const updatePriceItem = withAuthAction(updatePriceItemImpl);

async function deletePriceItemImpl(
  id: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "올바른 가격표 항목 ID가 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("price_items").delete().eq("id", id);

  if (error) {
    console.error("[action:price] deletePriceItem DB error:", error);
    return {
      success: false,
      error: "가격표 항목 처리 중 오류가 발생했습니다.",
    };
  }

  revalidatePricePaths();

  return { success: true, message: "가격표 항목이 삭제되었습니다." };
}

export const deletePriceItem = withAuthAction(deletePriceItemImpl);

async function togglePriceItemPublishedImpl(
  id: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string; message?: string }> {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { success: false, error: "올바른 가격표 항목 ID가 아닙니다." };
  }

  const boolResult = z.boolean().safeParse(isPublished);
  if (!boolResult.success) {
    return { success: false, error: "올바른 공개 상태 값이 아닙니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("price_items")
    .update({
      is_published: boolResult.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[action:price] togglePriceItemPublished DB error:", error);
    return {
      success: false,
      error: "가격표 항목 처리 중 오류가 발생했습니다.",
    };
  }

  revalidatePricePaths();

  return {
    success: true,
    message: `가격표 항목이 ${isPublished ? "공개" : "비공개"}로 변경되었습니다.`,
  };
}

export const togglePriceItemPublished = withAuthAction(
  togglePriceItemPublishedImpl,
);

interface PriceOrderItem {
  id: string;
  sort_order: number;
}

async function reorderPriceItemsImpl(
  items: PriceOrderItem[],
): Promise<{ success: boolean; error?: string }> {
  if (items.length === 0) {
    return { success: true };
  }

  if (items.length > MAX_REORDER_ITEMS) {
    return { success: false, error: "순서 변경 항목이 너무 많습니다." };
  }

  const sortOrderSchema = z.number().int().min(0);
  for (const item of items) {
    if (!uuidSchema.safeParse(item.id).success) {
      return { success: false, error: "올바른 가격표 항목 ID가 아닙니다." };
    }
    if (!sortOrderSchema.safeParse(item.sort_order).success) {
      return { success: false, error: "올바른 순서 값이 아닙니다." };
    }
  }

  const supabase = await createClient();

  const rpcItems = items.map((item) => ({
    id: item.id,
    order: item.sort_order,
  }));

  const { error } = await supabase.rpc("reorder_price_items", {
    items: rpcItems,
  });
  if (error) {
    console.error("[action:price] reorderPriceItems DB error:", error);
    return { success: false, error: "순서 변경 중 오류가 발생했습니다." };
  }

  revalidatePricePaths();

  return { success: true };
}

export const reorderPriceItems = withAuthAction(reorderPriceItemsImpl);
