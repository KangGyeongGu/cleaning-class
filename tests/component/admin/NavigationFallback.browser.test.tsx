import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalNavigation = Object.getOwnPropertyDescriptor(
  window,
  "navigation",
);
const pushState = history.pushState;
const replaceState = history.replaceState;

afterEach(() => {
  cleanup();
  history.pushState = pushState;
  history.replaceState = replaceState;
  if (originalNavigation)
    Object.defineProperty(window, "navigation", originalNavigation);
  else delete (window as Window & { navigation?: EventTarget }).navigation;
  vi.restoreAllMocks();
});

describe("이력 기반 작성 중 이탈 보호", () => {
  it("Navigation API 미지원 시 뒤로·앞으로 이동 취소의 방향을 구분", async () => {
    vi.resetModules();
    Object.defineProperty(window, "navigation", {
      configurable: true,
      value: undefined,
    });
    const { useUnsavedChanges } =
      await import("@/app/admin/lib/useUnsavedChanges");
    function Editor() {
      useUnsavedChanges(true);
      return null;
    }
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Editor />);
    history.pushState({}, "");
    history.pushState({}, "");
    const go = vi.spyOn(history, "go").mockImplementation(() => {});
    const index = history.state.__adminHistoryIndex as number;
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { __adminHistoryIndex: index - 1 },
      }),
    );
    expect(go).toHaveBeenLastCalledWith(1);
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { __adminHistoryIndex: index } }),
    );
    confirm.mockReturnValue(true);
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { __adminHistoryIndex: index - 1 },
      }),
    );
    confirm.mockReturnValue(false);
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { __adminHistoryIndex: index } }),
    );
    expect(go).toHaveBeenLastCalledWith(-1);
  });
});
