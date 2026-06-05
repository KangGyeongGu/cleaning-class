import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockRefresh = vi.hoisted(() => vi.fn());
const mockUseRouter = vi.hoisted(() => vi.fn(() => ({ refresh: mockRefresh })));

vi.mock("next/navigation", () => ({
  useRouter: mockUseRouter,
}));

import { useDragReorder } from "@/shared/lib/hooks/useDragReorder";

type Item = { id: string };
const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("useDragReorder", () => {
  it("initializes items state from initialItems", () => {
    const onReorder = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    expect(result.current.items).toEqual(items);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.dragIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it("tracks drag state via onDragStart + onDragEnter", () => {
    const onReorder = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(2);
    });
    expect(result.current.dragIndex).toBe(0);
    expect(result.current.dragOverIndex).toBe(2);
  });

  it("reorders items + calls onReorder on drag end", async () => {
    const onReorder = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(2);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(result.current.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(onReorder).toHaveBeenCalledOnce();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("no-ops when dragIndex === dragOverIndex (same position)", async () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(1);
      result.current.onDragEnter(1);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(onReorder).not.toHaveBeenCalled();
    expect(result.current.items).toEqual(items);
  });

  it("no-ops when drag was not started (both refs null)", async () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("rolls back items + calls router.refresh on onReorder { success: false }", async () => {
    const onReorder = vi
      .fn()
      .mockResolvedValue({ success: false, error: "denied" });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(2);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(result.current.items).toEqual(items);
    expect(window.alert).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("falls back to generic message when onReorder fails without error string", async () => {
    const onReorder = vi.fn().mockResolvedValue({ success: false });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(1);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("순서 변경"),
    );
  });

  it("rolls back items + alerts on thrown error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReorder = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(2);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(result.current.items).toEqual(items);
    expect(window.alert).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("sets isSaving=true during reorder, false after", async () => {
    let resolveFn!: (value: { success: boolean }) => void;
    const onReorder = vi.fn(
      () =>
        new Promise<{ success: boolean }>((r) => {
          resolveFn = r;
        }),
    );
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(1);
    });
    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.onDragEnd();
    });
    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });
    await act(async () => {
      resolveFn({ success: true });
      await endPromise;
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("syncs items when initialItems prop changes", () => {
    const onReorder = vi.fn();
    const { result, rerender } = renderHook(
      ({ list }: { list: Item[] }) => useDragReorder(list, onReorder),
      { initialProps: { list: items } },
    );
    expect(result.current.items).toEqual(items);
    const newList: Item[] = [{ id: "x" }, { id: "y" }];
    rerender({ list: newList });
    expect(result.current.items).toEqual(newList);
  });

  it("ignores onDragStart/onDragEnter while saving", async () => {
    let resolveFn!: (value: { success: boolean }) => void;
    const onReorder = vi.fn(
      () =>
        new Promise<{ success: boolean }>((r) => {
          resolveFn = r;
        }),
    );
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(1);
    });
    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.onDragEnd();
    });
    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });
    act(() => {
      result.current.onDragStart(2);
      result.current.onDragEnter(0);
    });
    expect(result.current.dragIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
    await act(async () => {
      resolveFn({ success: true });
      await endPromise;
    });
  });

  it("resets drag indices to null after end (regardless of result)", async () => {
    const onReorder = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDragReorder(items, onReorder));
    act(() => {
      result.current.onDragStart(0);
      result.current.onDragEnter(2);
    });
    await act(async () => {
      await result.current.onDragEnd();
    });
    expect(result.current.dragIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });
});
