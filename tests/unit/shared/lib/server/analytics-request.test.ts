import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldRecordAnalytics } from "@/shared/lib/server/analytics-request";

afterEach(() => vi.unstubAllEnvs());
describe("통계 수집 환경", () => {
  it("운영의 외부 호스트에서만 수집", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      shouldRecordAnalytics(new Headers({ host: "www.cleaningclass.co.kr" })),
    ).toBe(true);
    for (const host of [
      "localhost:3000",
      "127.0.0.1:3000",
      "[::1]:3000",
      "0.0.0.0",
      "preview.localhost",
      "bad host",
    ])
      expect(shouldRecordAnalytics(new Headers({ host }))).toBe(false);
    expect(shouldRecordAnalytics(new Headers())).toBe(false);
  });
  it("개발 모드에서 운영 도메인이어도 수집하지 않음", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      shouldRecordAnalytics(new Headers({ host: "www.cleaningclass.co.kr" })),
    ).toBe(false);
  });
});
