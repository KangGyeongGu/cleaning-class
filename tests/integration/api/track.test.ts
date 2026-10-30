import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/track/route";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  rpc: vi.fn(),
  visitor: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: async () => ({ from: () => ({ insert: mocks.insert }) }),
}));
vi.mock("@/shared/lib/server/analytics-client", () => ({
  createAnalyticsClient: () => ({
    rpc: mocks.rpc,
    from: () => ({ insert: mocks.insert }),
  }),
}));
vi.mock("@/shared/lib/server/analytics-visitor", () => ({
  dailyVisitor: mocks.visitor,
}));
vi.mock("@/shared/lib/server/rate-limit", () => ({
  checkRateLimit: mocks.limit,
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  mocks.limit.mockReturnValue(true);
  mocks.insert.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.visitor.mockReturnValue({ key: "a".repeat(64), date: "2026-10-29" });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
const visit = {
  event_type: "page_landing",
  event_payload: { source: "direct", referrer_host: "", landing_path: "/" },
  path: "/",
};
const phone = {
  event_type: "phone_click",
  event_payload: { phone_type: "cleaning", click_location: "hero" },
  path: "/",
};
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://www.cleaningclass.co.kr/api/track", {
    method: "POST",
    headers: {
      host: "www.cleaningclass.co.kr",
      "user-agent": "Mozilla/5.0",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
describe("통계 수집 API", () => {
  it("방문자 식별값을 서버에서 만들고 원자적 중복 방지 RPC에 전달", async () => {
    expect((await POST(request(visit))).status).toBe(204);
    expect(mocks.rpc).toHaveBeenCalledWith("record_daily_visitor", {
      p_key: "a".repeat(64),
      p_date: "2026-10-29",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("브라우저의 성공 주장은 무시하고 제출 시도는 서버 자격증명으로 저장", async () => {
    const attempt = {
      event_type: "quote_form_click",
      event_payload: { inquiry_type: "cleaning" },
      path: "/contact",
    };
    expect(
      (await POST(request({ ...attempt, event_type: "quote_form_success" })))
        .status,
    ).toBe(204);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect((await POST(request(attempt))).status).toBe(204);
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(attempt);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("전화 클릭은 기존 이벤트로 기록", async () => {
    expect((await POST(request(phone))).status).toBe(204);
    expect(mocks.insert).toHaveBeenCalledWith(phone);
  });
  it("봇·관리자 경로·로컬·개발 환경을 제외", async () => {
    expect(
      (await POST(request(visit, { "user-agent": "Googlebot" }))).status,
    ).toBe(204);
    expect(
      (await POST(request({ ...visit, path: "/admin/dashboard" }))).status,
    ).toBe(204);
    expect(
      (await POST(request(visit, { host: "localhost:3000" }))).status,
    ).toBe(204);
    vi.stubEnv("NODE_ENV", "development");
    expect((await POST(request(visit))).status).toBe(204);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("저장·설정 실패에 성공 응답을 보내지 않음", async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { code: "DENIED" } });
    expect((await POST(request(visit))).status).toBe(503);
    mocks.visitor.mockImplementationOnce(() => {
      throw new Error("missing secret");
    });
    expect((await POST(request(visit))).status).toBe(503);
    mocks.insert.mockResolvedValueOnce({ error: { code: "DENIED" } });
    expect((await POST(request(phone))).status).toBe(503);
  });
  it("요청 제한 초과와 손상된 JSON을 거부", async () => {
    mocks.limit.mockReturnValueOnce(false);
    expect((await POST(request(phone))).status).toBe(429);
    const broken = new Request("https://www.cleaningclass.co.kr/api/track", {
      method: "POST",
      headers: { host: "www.cleaningclass.co.kr" },
      body: "{",
    });
    expect((await POST(broken)).status).toBe(400);
  });
});
