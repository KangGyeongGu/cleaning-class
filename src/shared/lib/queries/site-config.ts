import { cache } from "react";
import { createStaticClient } from "@/shared/lib/supabase/static";
import type { SiteConfig } from "@/shared/types/database";

export const getSiteConfig = cache(async (): Promise<SiteConfig | null> => {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .single();
  if (error) throw error;
  return data as SiteConfig | null;
});
