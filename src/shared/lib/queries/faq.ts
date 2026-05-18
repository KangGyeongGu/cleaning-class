import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import type { FaqRow } from "@/shared/types/database";

export async function getActiveFaqs(): Promise<FaqRow[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getActiveFaqs] 활성 FAQ 목록 조회 실패:", error);
    return [];
  }

  return (data as FaqRow[]) ?? [];
}

export async function getAllFaqs(): Promise<FaqRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getAllFaqs] FAQ 전체 목록 조회 실패:", error);
    return [];
  }

  return (data as FaqRow[]) ?? [];
}

export async function getFaqById(id: string): Promise<FaqRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error) {
      console.error(`[getFaqById] FAQ 조회 실패 (id=${id}):`, error);
    }
    return null;
  }

  return data as FaqRow;
}

export async function getNextFaqDisplayOrder(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getNextFaqDisplayOrder] display_order 조회 실패:", error);
    }
    return 0;
  }

  return (data?.display_order ?? -1) + 1;
}
