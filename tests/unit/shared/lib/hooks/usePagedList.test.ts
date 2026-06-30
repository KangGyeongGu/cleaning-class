import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePagedList } from "@/shared/lib/hooks/usePagedList";

const items = Array.from({ length: 25 }, (_, i) => i);

describe("usePagedList", () => {
  it("slices the first page and computes totalPages", () => {
    const { result } = renderHook(() => usePagedList(items, 10));
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageItems).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("slices the requested page via setPage", () => {
    const { result } = renderHook(() => usePagedList(items, 10));
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual([20, 21, 22, 23, 24]);
  });

  it("clamps page above totalPages", () => {
    const { result } = renderHook(() => usePagedList(items, 10));
    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual([20, 21, 22, 23, 24]);
  });

  it("clamps the page down when items shrink to fewer pages", () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: number[] }) => usePagedList(list, 10),
      { initialProps: { list: items } },
    );
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    rerender({ list: items.slice(0, 15) });
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([10, 11, 12, 13, 14]);
  });

  it("keeps page at 1 for an empty list", () => {
    const { result } = renderHook(() => usePagedList<number>([], 10));
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.pageItems).toEqual([]);
  });
});
