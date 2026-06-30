import { cache } from "react";
import { createStaticClient } from "@/shared/lib/supabase/static";
import type { SiteConfig } from "@/shared/types/database";

export const getSiteConfig = cache(async (): Promise<SiteConfig | null> => {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .single();
    if (error) {
      console.error("[getSiteConfig] DB error:", error);
      return null;
    }
    return data as SiteConfig;
  } catch (err) {
    console.error("[getSiteConfig] Unexpected error:", err);
    return null;
  }
});
