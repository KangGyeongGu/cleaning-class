import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyVisitor } from "@/shared/lib/server/analytics-visitor";

afterEach(() => vi.unstubAllEnvs());
describe("쿠키 없는 일별 방문자 식별", () => {
  const headers = new Headers({
    "cf-connecting-ip": "192.0.2.1",
    "user-agent": "test-browser",
  });
  function setup() {
    vi.stubEnv("ANALYTICS_HASH_SECRET", "a".repeat(32));
    vi.stubEnv("ANALYTICS_TRUST_CLOUDFLARE", "true");
  }
  it("같은 한국 날짜 중복과 날짜 경계", () => {
    setup();
    const key = dailyVisitor(headers, new Date("2026-10-28T15:00:00Z"));
    expect(key.date).toBe("2026-10-29");
    expect(key.key).toMatch(/^[a-f0-9]{64}$/);
    expect(dailyVisitor(headers, new Date("2026-10-29T14:59:59Z"))).toEqual(
      key,
    );
    expect(dailyVisitor(headers, new Date("2026-10-29T15:00:00Z"))).not.toEqual(
      key,
    );
    expect(
      dailyVisitor(
        new Headers({
          "cf-connecting-ip": "192.0.2.2",
          "user-agent": "test-browser",
        }),
      ),
    ).not.toEqual(dailyVisitor(headers));
  });
  it("비밀키와 신뢰된 프록시 설정 필수", () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", "");
    expect(() => dailyVisitor(headers)).toThrow("32자");
    vi.stubEnv("ANALYTICS_HASH_SECRET", "short");
    expect(() => dailyVisitor(headers)).toThrow("32자");
    setup();
    vi.stubEnv("ANALYTICS_TRUST_CLOUDFLARE", "false");
    expect(() => dailyVisitor(headers)).toThrow("실제 접속 IP");
  });
  it("없는 IP/UA와 잘못된 IP를 같은 방문자로 합치지 않음", () => {
    setup();
    for (const input of [
      new Headers(),
      new Headers({ "cf-connecting-ip": "bad", "user-agent": "test" }),
      new Headers({ "cf-connecting-ip": "192.0.2.1" }),
      new Headers({ "cf-connecting-ip": "192.0.2.1", "user-agent": " " }),
    ]) {
      expect(() => dailyVisitor(input)).toThrow("요청 정보");
    }
  });
});
