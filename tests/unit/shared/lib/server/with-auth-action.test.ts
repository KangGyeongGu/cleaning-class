import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));

import { withAuthAction } from "@/shared/lib/server/with-auth-action";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ id: "admin" });
});

describe("withAuthAction", () => {
  it("authenticates then forwards args and returns the inner result", async () => {
    const inner = vi.fn(async (a: number, b: number) => ({
      success: true as const,
      sum: a + b,
    }));
    const wrapped = withAuthAction(inner);
    const result = await wrapped(2, 3);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledWith(2, 3);
    expect(result).toEqual({ success: true, sum: 5 });
  });

  it("returns a standard failure when authentication throws (inner not called)", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("unauth"));
    const inner = vi.fn(async () => ({ success: true as const }));
    const wrapped = withAuthAction(inner);
    const result = await wrapped();
    expect(inner).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "처리 중 오류가 발생했습니다.",
    });
  });

  it("returns a standard failure when the inner action throws", async () => {
    const inner = vi.fn(async () => {
      throw new Error("boom");
    });
    const wrapped = withAuthAction(inner);
    expect(await wrapped()).toEqual({
      success: false,
      error: "처리 중 오류가 발생했습니다.",
    });
  });
});
