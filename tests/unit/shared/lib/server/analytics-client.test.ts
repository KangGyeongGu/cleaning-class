import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnalyticsClient } from "@/shared/lib/server/analytics-client";

const create = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => ({ createClient: create }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SECRET_KEY", undefined);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("서버 전용 통계 클라이언트", () => {
  it("서버 키를 사용하고 브라우저 세션 처리를 비활성화", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-legacy");
    createAnalyticsClient();
    expect(create).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-secret",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
  it("기존 service role 키도 지원", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-legacy");
    createAnalyticsClient();
    expect(create.mock.calls[0][1]).toBe("test-legacy");
  });
  it("URL이나 서버 키가 없으면 공개 키로 대체하지 않음", () => {
    expect(() => createAnalyticsClient()).toThrow("자격증명");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => createAnalyticsClient()).toThrow("자격증명");
    expect(create).not.toHaveBeenCalled();
  });
});
