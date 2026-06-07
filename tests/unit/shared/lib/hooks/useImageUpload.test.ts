import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageUpload } from "@/shared/lib/hooks/useImageUpload";

let urlCounter = 0;
beforeEach(() => {
  urlCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(
    () => `blob:test-${++urlCounter}`,
  ) as unknown as typeof URL.createObjectURL;
  globalThis.URL.revokeObjectURL =
    vi.fn() as unknown as typeof URL.revokeObjectURL;
});

function makeFile(name: string): File {
  return new File(["x"], name, { type: "image/jpeg" });
}

describe("useImageUpload", () => {
  it("should start with empty images and previews", () => {
    const { result } = renderHook(() => useImageUpload());
    expect(result.current.images).toEqual([]);
    expect(result.current.previewUrls).toEqual([]);
  });

  it("should add files and create preview URLs", () => {
    const { result } = renderHook(() => useImageUpload());
    act(() => {
      result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);
    });
    expect(result.current.images).toHaveLength(2);
    expect(result.current.previewUrls).toHaveLength(2);
  });

  it("should reject additions that exceed max count", () => {
    const { result } = renderHook(() => useImageUpload(2));
    act(() => {
      result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);
    });
    act(() => {
      result.current.addFiles([makeFile("c.jpg")]);
    });
    expect(result.current.images).toHaveLength(2);
  });

  it("should remove specific index and revoke its URL", () => {
    const { result } = renderHook(() => useImageUpload());
    act(() => {
      result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);
    });
    const urlToRevoke = result.current.previewUrls[0];
    act(() => {
      result.current.removeAt(0);
    });
    expect(result.current.images).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(urlToRevoke);
  });

  it("should tolerate removeAt with out-of-range index", () => {
    const { result } = renderHook(() => useImageUpload());
    act(() => {
      result.current.removeAt(99);
    });
    expect(result.current.images).toEqual([]);
  });

  it("should clear all images and revoke all URLs", () => {
    const { result } = renderHook(() => useImageUpload());
    act(() => {
      result.current.addFiles([makeFile("a.jpg"), makeFile("b.jpg")]);
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.images).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
