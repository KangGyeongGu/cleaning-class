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

describe("작성 중 이탈 보호", () => {
  it("Navigation API의 이동 취소와 저장 중 차단", async () => {
    vi.resetModules();
    const navigation = new EventTarget();
    Object.defineProperty(window, "navigation", {
      configurable: true,
      value: navigation,
    });
    const { useUnsavedChanges } =
      await import("@/app/admin/lib/useUnsavedChanges");
    function Editor({
      dirty,
      blocked = false,
    }: {
      dirty: boolean;
      blocked?: boolean;
    }) {
      useUnsavedChanges(dirty, blocked);
      return null;
    }
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { rerender } = render(<Editor dirty />);
    function traverse() {
      const event = new Event("navigate", { cancelable: true });
      Object.defineProperty(event, "navigationType", { value: "traverse" });
      navigation.dispatchEvent(event);
      return event.defaultPrevented;
    }
    expect(traverse()).toBe(true);
    confirm.mockReturnValue(true);
    expect(traverse()).toBe(false);
    rerender(<Editor dirty blocked />);
    expect(traverse()).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
    rerender(<Editor dirty={false} />);
    expect(traverse()).toBe(false);
  });
});
