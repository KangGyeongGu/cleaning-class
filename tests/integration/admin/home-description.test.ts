import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateHomeDescription } from "@/app/admin/(protected)/config/actions";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  from: vi.fn(),
  revalidate: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mocks.auth }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: "admin" });
  mocks.from.mockReturnValue({ select: mocks.select, update: mocks.update });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: "config-1" }, error: null });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockResolvedValue({ error: null });
});
describe("홈 소개글 저장", () => {
  it.each(["새 메인 소개글", ""])(
    "기존 description 열만 변경: %s",
    async (value) => {
      expect(await updateHomeDescription(value)).toEqual({ success: true });
      expect(mocks.auth).toHaveBeenCalled();
      expect(mocks.update).toHaveBeenCalledWith({
        description: value,
        updated_at: expect.any(String),
      });
      expect(mocks.eq).toHaveBeenCalledWith("id", "config-1");
      expect(mocks.revalidate).toHaveBeenCalledWith("/");
      expect(mocks.revalidate).toHaveBeenCalledWith("/admin/config");
    },
  );
  it("인증되지 않은 요청은 데이터에 접근하지 않음", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("unauthorized"));
    expect((await updateHomeDescription("문구")).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("길이 제한 위반은 저장하지 않음", async () => {
    expect((await updateHomeDescription("가".repeat(501))).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: new Error("db") },
    { data: null, error: null },
  ])("조회 실패나 설정 부재 시 저장하지 않음", async (result) => {
    mocks.single.mockResolvedValueOnce(result);
    expect((await updateHomeDescription("문구")).success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("저장 실패 시 성공 표시와 경로 갱신을 하지 않음", async () => {
    mocks.eq.mockResolvedValueOnce({ error: new Error("update") });
    expect((await updateHomeDescription("문구")).success).toBe(false);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("저장 후 캐시 갱신 오류가 발생해도 저장 성공을 유지", async () => {
    mocks.revalidate.mockImplementation(() => {
      throw new Error("cache");
    });
    expect((await updateHomeDescription("문구")).success).toBe(true);
  });
});
