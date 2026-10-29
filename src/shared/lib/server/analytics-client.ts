import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";

export function createAnalyticsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("서버 전용 Supabase 통계 자격증명이 설정되지 않았습니다.");
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
