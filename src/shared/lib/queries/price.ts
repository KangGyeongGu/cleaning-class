import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import type { PriceItemRow } from "@/shared/types/database";

export async function getPublishedPriceItems(): Promise<PriceItemRow[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("price_items")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(
      "[getPublishedPriceItems] 공개 가격표 목록 조회 실패:",
      error,
    );
    return [];
  }

  return (data as PriceItemRow[]) ?? [];
}

export async function getAllPriceItems(): Promise<PriceItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getAllPriceItems] 가격표 전체 목록 조회 실패:", error);
    return [];
  }

  return (data as PriceItemRow[]) ?? [];
}

export async function getPriceItemById(
  id: string,
): Promise<PriceItemRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error) {
      console.error(`[getPriceItemById] 가격표 조회 실패 (id=${id}):`, error);
    }
    return null;
  }

  return data as PriceItemRow;
}

export async function getNextPriceItemSortOrder(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getNextPriceItemSortOrder] sort_order 조회 실패:", error);
    }
    return 0;
  }

  return (data?.sort_order ?? -1) + 1;
}
