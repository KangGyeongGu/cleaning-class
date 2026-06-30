import { createClient } from "@/shared/lib/supabase/server";
import { SUPABASE_NOT_FOUND_CODE } from "@/shared/lib/pure/constants";

export async function getNextOrder(
  table: "services" | "price_items" | "faqs",
  column: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .order(column, { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== SUPABASE_NOT_FOUND_CODE) {
      console.error(`[getNextOrder] ${table}.${column} 조회 실패:`, error);
    }
    return 0;
  }

  const value = (data as unknown as Record<string, number> | null)?.[column];
  return (value ?? -1) + 1;
}
