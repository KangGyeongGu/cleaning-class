import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockSubmit = vi.hoisted(() => vi.fn());
const mockTrack = vi.hoisted(() => vi.fn());
const mockCurrentPath = vi.hoisted(() => vi.fn(() => "/contact"));

vi.mock("@/shared/actions/contact", () => ({
  submitContactForm: mockSubmit,
}));

vi.mock("@/shared/lib/infra/track", () => ({
  track: mockTrack,
  currentPath: mockCurrentPath,
}));

import { useContactForm } from "@/shared/lib/hooks/useContactForm";

type Params = Parameters<typeof useContactForm>[0];

function baseParams(overrides: Partial<Params> = {}): Params {
  return {
    inquiryType: "cleaning",
    hasImages: false,
    addressValid: true,
    onReset: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

async function submitWith(result: unknown, params: Partial<Params> = {}) {
  mockSubmit.mockReturnValue(result);
  const hook = renderHook((p: Params) => useContactForm(p), {
    initialProps: baseParams(params),
  });
  await act(async () => {
    hook.result.current.formAction(new FormData());
  });
  await waitFor(() =>
    expect(hook.result.current.state).toEqual(result as object),
  );
  return hook;
}

describe("useContactForm", () => {
  it("초기 상태: state null, formValid false, showSuccess false", () => {
    const { result } = renderHook(() => useContactForm(baseParams()));
    expect(result.current.state).toBeNull();
    expect(result.current.isPending).toBe(false);
    expect(result.current.formValid).toBe(false);
    expect(result.current.showSuccess).toBe(false);
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("성공 시 quote_form_success 추적", async () => {
    const { result } = await submitWith(
      { success: true, message: "ok" },
      { inquiryType: "moving", hasImages: true },
    );
    expect(result.current.showSuccess).toBe(true);
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "quote_form_success",
          event_payload: expect.objectContaining({
            inquiry_type: "moving",
            has_images: true,
          }),
        }),
      ),
    );
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it("검증 실패 시 error_kind=validation", async () => {
    await submitWith({ success: false, errors: { name: ["필수"] } });
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "quote_form_error",
          event_payload: { inquiry_type: "cleaning", error_kind: "validation" },
        }),
      ),
    );
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it("성공→비성공 전이 후 다시 성공 시 재트래킹 (hasTrackedLead 리셋)", async () => {
    const successCount = (): number =>
      mockTrack.mock.calls.filter(
        (c) =>
          (c[0] as { event_type: string }).event_type === "quote_form_success",
      ).length;

    mockSubmit.mockReturnValue({ success: true, message: "ok" });
    const hook = renderHook((p: Params) => useContactForm(p), {
      initialProps: baseParams(),
    });
    await act(async () => {
      hook.result.current.formAction(new FormData());
    });
    await waitFor(() => expect(successCount()).toBe(1));

    mockSubmit.mockReturnValue({ success: false, error: "잠시 후 다시" });
    await act(async () => {
      hook.result.current.formAction(new FormData());
    });
    await waitFor(() =>
      expect(hook.result.current.state).toEqual({
        success: false,
        error: "잠시 후 다시",
      }),
    );
    expect(successCount()).toBe(1);

    mockSubmit.mockReturnValue({ success: true, message: "ok" });
    await act(async () => {
      hook.result.current.formAction(new FormData());
    });
    await waitFor(() => expect(successCount()).toBe(2));
  });

  it("이미지 오류 시 error_kind=upload_fail", async () => {
    await submitWith({ success: false, error: "이미지 변환 실패" });
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event_payload: {
            inquiry_type: "cleaning",
            error_kind: "upload_fail",
          },
        }),
      ),
    );
  });

  it("메일 오류 시 error_kind=mail_fail", async () => {
    await submitWith({ success: false, error: "이메일 발송 실패 SMTP" });
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event_payload: { inquiry_type: "cleaning", error_kind: "mail_fail" },
        }),
      ),
    );
  });

  it("기타 오류 시 error_kind=unknown", async () => {
    await submitWith({ success: false, error: "잠시 후 다시" });
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event_payload: { inquiry_type: "cleaning", error_kind: "unknown" },
        }),
      ),
    );
  });

  it("모든 필드가 채워지면 formValid true", () => {
    const { result } = renderHook(() => useContactForm(baseParams()));
    act(() => {
      result.current.setName("홍길동");
      result.current.setPhone("010-1234-5678");
      result.current.setServiceType("거주청소");
      result.current.setMessage("x".repeat(50));
    });
    expect(result.current.formValid).toBe(true);
  });

  it("message 49자면 formValid false (50자 경계)", () => {
    const { result } = renderHook(() => useContactForm(baseParams()));
    act(() => {
      result.current.setName("홍길동");
      result.current.setPhone("010-1234-5678");
      result.current.setServiceType("거주청소");
      result.current.setMessage("x".repeat(49));
    });
    expect(result.current.formValid).toBe(false);
  });

  it("addressValid false면 formValid false", () => {
    const { result } = renderHook(() =>
      useContactForm(baseParams({ addressValid: false })),
    );
    act(() => {
      result.current.setName("홍길동");
      result.current.setPhone("010-1234-5678");
      result.current.setServiceType("거주청소");
      result.current.setMessage("x".repeat(50));
    });
    expect(result.current.formValid).toBe(false);
  });

  it("trackClick 호출 시 quote_form_click 추적", () => {
    const { result } = renderHook(() => useContactForm(baseParams()));
    act(() => result.current.trackClick());
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "quote_form_click" }),
    );
  });

  it("clearReset: isReset false면 무동작", () => {
    const { result } = renderHook(() => useContactForm(baseParams()));
    act(() => result.current.clearReset());
    expect(result.current.showSuccess).toBe(false);
  });

  describe("3초 후 리셋", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("성공 3초 후 필드·이미지 리셋, isReset 토글 후 clearReset 으로 해제", async () => {
      const onReset = vi.fn();
      mockSubmit.mockReturnValue({ success: true, message: "ok" });
      const hook = renderHook((p: Params) => useContactForm(p), {
        initialProps: baseParams({ onReset }),
      });
      await act(async () => {
        hook.result.current.setName("홍길동");
        hook.result.current.formAction(new FormData());
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(hook.result.current.name).toBe("");
      expect(hook.result.current.showSuccess).toBe(false);

      act(() => hook.result.current.clearReset());
      expect(hook.result.current.showSuccess).toBe(true);
    });
  });
});
