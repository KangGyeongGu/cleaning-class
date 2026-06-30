import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import type { RowActionResult } from "@/shared/lib/hooks/useListRowActions";

const mockRefresh = vi.hoisted(() => vi.fn());
const mockUseRouter = vi.hoisted(() => vi.fn(() => ({ refresh: mockRefresh })));

vi.mock("next/navigation", () => ({
  useRouter: mockUseRouter,
}));

import { useListRowActions } from "@/shared/lib/hooks/useListRowActions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("useListRowActions", () => {
  it("runDelete confirms, tracks deletingId, refreshes on success", async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runDelete("id-1", action, {
        confirmMessage: "삭제?",
        errorMessage: "삭제 실패",
        logLabel: "삭제 예외:",
      });
    });

    expect(window.confirm).toHaveBeenCalledWith("삭제?");
    expect(action).toHaveBeenCalledOnce();
    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.deletingId).toBeNull();
  });

  it("tracks deletingId mid-flight and leaves togglingId untouched", async () => {
    let resolveFn!: (value: RowActionResult) => void;
    const action = vi.fn(
      () =>
        new Promise<RowActionResult>((r) => {
          resolveFn = r;
        }),
    );
    const { result } = renderHook(() => useListRowActions());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.runDelete("id-1", action, {
        confirmMessage: "삭제?",
        errorMessage: "삭제 실패",
        logLabel: "삭제 예외:",
      });
    });

    await waitFor(() => expect(result.current.deletingId).toBe("id-1"));
    expect(result.current.togglingId).toBeNull();

    await act(async () => {
      resolveFn({ success: true });
      await pending;
    });
    expect(result.current.deletingId).toBeNull();
  });

  it("tracks togglingId mid-flight and leaves deletingId untouched", async () => {
    let resolveFn!: (value: RowActionResult) => void;
    const action = vi.fn(
      () =>
        new Promise<RowActionResult>((r) => {
          resolveFn = r;
        }),
    );
    const { result } = renderHook(() => useListRowActions());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.runToggle("id-1", action, {
        errorMessage: "변경 실패",
        logLabel: "변경 예외:",
      });
    });

    await waitFor(() => expect(result.current.togglingId).toBe("id-1"));
    expect(result.current.deletingId).toBeNull();

    await act(async () => {
      resolveFn({ success: true });
      await pending;
    });
    expect(result.current.togglingId).toBeNull();
  });

  it("runDelete aborts when confirm is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runDelete("id-1", action, {
        confirmMessage: "삭제?",
        errorMessage: "삭제 실패",
        logLabel: "삭제 예외:",
      });
    });

    expect(action).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("runToggle skips confirm and refreshes on success", async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runToggle("id-1", action, {
        errorMessage: "변경 실패",
        logLabel: "변경 예외:",
      });
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.togglingId).toBeNull();
  });

  it("alerts the action error when result is not successful", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ success: false, error: "거부됨" });
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runToggle("id-1", action, {
        errorMessage: "변경 실패",
        logLabel: "변경 예외:",
      });
    });

    expect(window.alert).toHaveBeenCalledWith("거부됨");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("falls back to errorMessage when result has no error string", async () => {
    const action = vi.fn().mockResolvedValue({ success: false });
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runToggle("id-1", action, {
        errorMessage: "변경 실패",
        logLabel: "변경 예외:",
      });
    });

    expect(window.alert).toHaveBeenCalledWith("변경 실패");
  });

  it("logs and alerts errorMessage when the action throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const action = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useListRowActions());

    await act(async () => {
      await result.current.runDelete("id-1", action, {
        confirmMessage: "삭제?",
        errorMessage: "삭제 실패",
        logLabel: "삭제 예외:",
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith("삭제 예외:", expect.any(Error));
    expect(window.alert).toHaveBeenCalledWith("삭제 실패");
    expect(result.current.deletingId).toBeNull();
    consoleSpy.mockRestore();
  });
});
