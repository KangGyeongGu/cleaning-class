import { getUser } from "@/shared/lib/supabase/auth";

export function withAuthAction<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | { success: false; error: string }> {
  return async (...args: Args) => {
    try {
      await getUser();
      return await fn(...args);
    } catch {
      return { success: false, error: "처리 중 오류가 발생했습니다." };
    }
  };
}
