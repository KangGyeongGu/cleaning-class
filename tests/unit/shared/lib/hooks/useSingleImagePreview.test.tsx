import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSingleImagePreview } from "@/shared/lib/hooks/useSingleImagePreview";

class FakeDataTransfer {
  items = {
    files: [] as File[],
    add: (file: File) => {
      this.items.files.push(file);
    },
  };
  get files(): FileList {
    return Object.assign([...this.items.files], {
      item: (i: number) => this.items.files[i] ?? null,
    }) as unknown as FileList;
  }
}

vi.mock("heic2any", () => ({
  default: vi.fn(async () => new Blob(["jpeg"], { type: "image/jpeg" })),
}));

let urlCounter = 0;
beforeEach(() => {
  urlCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(
    () => `blob:test-${++urlCounter}`,
  ) as unknown as typeof URL.createObjectURL;
  globalThis.URL.revokeObjectURL =
    vi.fn() as unknown as typeof URL.revokeObjectURL;
  globalThis.alert = vi.fn();
  (
    globalThis as unknown as { DataTransfer: typeof FakeDataTransfer }
  ).DataTransfer = FakeDataTransfer;
});

function makeFile(name: string, type: string, size = 100): File {
  const f = new File([new Uint8Array(Math.min(size, 16))], name, { type });
  if (f.size !== size) Object.defineProperty(f, "size", { value: size });
  return f;
}

function toFileList(files: File[]): FileList {
  return Object.assign([...files], {
    item: (i: number) => files[i] ?? null,
  }) as unknown as FileList;
}

interface FakeInput {
  files: FileList | null;
  value: string;
}

function changeEvent(files: File[] | null): {
  event: React.ChangeEvent<HTMLInputElement>;
  input: FakeInput;
} {
  const input: FakeInput = {
    files: files ? toFileList(files) : null,
    value: "x",
  };
  return {
    event: { target: input } as unknown as React.ChangeEvent<HTMLInputElement>,
    input,
  };
}

describe("useSingleImagePreview", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useSingleImagePreview());
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.isConverting).toBe(false);
  });

  it("previews a valid jpeg without touching input.files", async () => {
    const { result } = renderHook(() => useSingleImagePreview());
    const { event, input } = changeEvent([makeFile("a.jpg", "image/jpeg")]);
    await act(async () => {
      await result.current.handleChange(event);
    });
    expect(result.current.previewUrl).toBe("blob:test-1");
    expect(input.files?.[0].name).toBe("a.jpg");
  });

  it("clears preview when no file is selected", async () => {
    const { result } = renderHook(() => useSingleImagePreview());
    const { event } = changeEvent(null);
    await act(async () => {
      await result.current.handleChange(event);
    });
    expect(result.current.previewUrl).toBeNull();
  });

  it("rejects a disallowed type and clears the input", async () => {
    const { result } = renderHook(() => useSingleImagePreview());
    const { event, input } = changeEvent([
      makeFile("doc.pdf", "application/pdf"),
    ]);
    await act(async () => {
      await result.current.handleChange(event);
    });
    expect(result.current.previewUrl).toBeNull();
    expect(globalThis.alert).toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("converts HEIC to jpeg and replaces input.files", async () => {
    const { result } = renderHook(() => useSingleImagePreview());
    const { event, input } = changeEvent([
      makeFile("photo.heic", "image/heic"),
    ]);
    await act(async () => {
      await result.current.handleChange(event);
    });
    await waitFor(() => expect(result.current.previewUrl).not.toBeNull());
    expect(input.files?.[0].name).toBe("photo.jpg");
    expect(input.files?.[0].type).toBe("image/jpeg");
  });

  it("sets isConverting true while HEIC conversion is pending", async () => {
    const heic2any = await import("heic2any");
    let resolveConv!: (blob: Blob) => void;
    vi.mocked(heic2any.default).mockReturnValueOnce(
      new Promise<Blob>((r) => {
        resolveConv = r;
      }),
    );
    const { result } = renderHook(() => useSingleImagePreview());
    const { event } = changeEvent([makeFile("photo.heic", "image/heic")]);

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleChange(event);
    });

    await waitFor(() => expect(result.current.isConverting).toBe(true));
    expect(result.current.previewUrl).toBeNull();

    await act(async () => {
      resolveConv(new Blob(["jpeg"], { type: "image/jpeg" }));
      await pending;
    });
    expect(result.current.isConverting).toBe(false);
    expect(result.current.previewUrl).not.toBeNull();
  });

  it("alerts and clears when HEIC conversion fails", async () => {
    const heic2any = await import("heic2any");
    vi.mocked(heic2any.default).mockRejectedValueOnce(new Error("decode fail"));
    const { result } = renderHook(() => useSingleImagePreview());
    const { event, input } = changeEvent([makeFile("bad.heic", "image/heic")]);
    await act(async () => {
      await result.current.handleChange(event);
    });
    expect(result.current.previewUrl).toBeNull();
    expect(globalThis.alert).toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("skips input sync when DataTransfer is unavailable", async () => {
    delete (globalThis as unknown as { DataTransfer?: unknown }).DataTransfer;
    const { result } = renderHook(() => useSingleImagePreview());
    const { event, input } = changeEvent([
      makeFile("photo.heic", "image/heic"),
    ]);
    await act(async () => {
      await result.current.handleChange(event);
    });
    await waitFor(() => expect(result.current.previewUrl).not.toBeNull());
    expect(input.files?.[0].name).toBe("photo.heic");
  });

  it("swallows errors when input.files is read-only", async () => {
    const fileList = toFileList([makeFile("photo.heic", "image/heic")]);
    const target = { value: "x" } as { value: string; files: FileList | null };
    Object.defineProperty(target, "files", {
      configurable: true,
      get: () => fileList,
    });
    const event = {
      target,
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    const { result } = renderHook(() => useSingleImagePreview());
    await act(async () => {
      await result.current.handleChange(event);
    });
    await waitFor(() => expect(result.current.previewUrl).not.toBeNull());
  });

  it("revokes the previous blob url when a new file is selected", async () => {
    const { result } = renderHook(() => useSingleImagePreview());
    await act(async () => {
      await result.current.handleChange(
        changeEvent([makeFile("a.jpg", "image/jpeg")]).event,
      );
    });
    await act(async () => {
      await result.current.handleChange(
        changeEvent([makeFile("b.jpg", "image/jpeg")]).event,
      );
    });
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-1");
  });

  it("revokes the blob url on unmount", async () => {
    const { result, unmount } = renderHook(() => useSingleImagePreview());
    await act(async () => {
      await result.current.handleChange(
        changeEvent([makeFile("a.jpg", "image/jpeg")]).event,
      );
    });
    unmount();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-1");
  });
});
