import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInViewport } from "@/shared/lib/hooks/useInViewport";

interface MockObserver {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (isIntersecting: boolean) => void;
}

let lastObserver: MockObserver | null = null;
let originalIO: typeof IntersectionObserver;

beforeEach(() => {
  originalIO = globalThis.IntersectionObserver;
  class FakeIO {
    constructor(cb: IntersectionObserverCallback) {
      const obs: MockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        trigger(isIntersecting: boolean) {
          cb(
            [{ isIntersecting } as IntersectionObserverEntry],
            obs as unknown as IntersectionObserver,
          );
        },
      };
      lastObserver = obs;
      return obs as unknown as IntersectionObserver;
    }
  }
  globalThis.IntersectionObserver =
    FakeIO as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = originalIO;
  lastObserver = null;
});

describe("useInViewport", () => {
  it("should start with isVisible=false", () => {
    const { result } = renderHook(() => useInViewport());
    expect(result.current.isVisible).toBe(false);
  });

  it("should not create observer when ref called with null", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(null);
    });
    expect(lastObserver).toBe(null);
  });

  it("should create observer and observe element when ref called", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    expect(lastObserver?.observe).toHaveBeenCalled();
  });

  it("should set isVisible=true when IO triggers intersecting", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    act(() => {
      lastObserver?.trigger(true);
    });
    expect(result.current.isVisible).toBe(true);
  });

  it("should disconnect observer after becoming visible", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    const obs = lastObserver;
    act(() => {
      obs?.trigger(true);
    });
    expect(obs?.disconnect).toHaveBeenCalled();
  });

  it("should remain hidden when IO triggers not intersecting", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    act(() => {
      lastObserver?.trigger(false);
    });
    expect(result.current.isVisible).toBe(false);
  });

  it("should disconnect previous observer when ref called again", () => {
    const { result } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    const first = lastObserver;
    act(() => {
      result.current.ref(document.createElement("span"));
    });
    expect(first?.disconnect).toHaveBeenCalled();
  });

  it("should disconnect observer on unmount", () => {
    const { result, unmount } = renderHook(() => useInViewport());
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    const obs = lastObserver;
    unmount();
    expect(obs?.disconnect).toHaveBeenCalled();
  });

  it("should keep a stable ref callback across rerenders with default options", () => {
    const { result, rerender } = renderHook(() => useInViewport());
    const firstRef = result.current.ref;
    rerender();
    expect(result.current.ref).toBe(firstRef);
  });
});
