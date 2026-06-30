/* eslint-disable react-hooks/refs */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderHook,
  act,
  waitFor,
  render,
  fireEvent,
} from "@testing-library/react";
import { useContactImageHandler } from "@/shared/lib/hooks/useContactImageHandler";

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
  const bytes = new Uint8Array(Math.min(size, 16));
  const f = new File([bytes], name, { type });
  if (f.size !== size) {
    Object.defineProperty(f, "size", { value: size });
  }
  return f;
}

function makeChangeEvent(files: File[]): React.ChangeEvent<HTMLInputElement> {
  const fileList = Object.assign([...files], {
    item: (i: number) => files[i] ?? null,
  }) as unknown as FileList;
  return {
    target: { files: fileList },
    currentTarget: { files: fileList },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe("useContactImageHandler", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useContactImageHandler());
    expect(result.current.images).toEqual([]);
    expect(result.current.previewUrls).toEqual([]);
    expect(result.current.isConverting).toBe(false);
  });

  it("adds valid JPEG files", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const file = makeFile("a.jpg", "image/jpeg");
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([file]));
    });
    expect(result.current.images).toHaveLength(1);
    expect(result.current.previewUrls).toHaveLength(1);
  });

  it("rejects when more than 4 images selected", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const files = [
      makeFile("1.jpg", "image/jpeg"),
      makeFile("2.jpg", "image/jpeg"),
      makeFile("3.jpg", "image/jpeg"),
      makeFile("4.jpg", "image/jpeg"),
      makeFile("5.jpg", "image/jpeg"),
    ];
    await act(async () => {
      await result.current.handleChange(makeChangeEvent(files));
    });
    expect(result.current.images).toHaveLength(0);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it("rejects single image over 25MB", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const big = makeFile("big.jpg", "image/jpeg", 26 * 1024 * 1024);
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([big]));
    });
    expect(result.current.images).toHaveLength(0);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it("rejects disallowed MIME type", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const pdf = makeFile("doc.pdf", "application/pdf");
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([pdf]));
    });
    expect(result.current.images).toHaveLength(0);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it("converts HEIC file to JPEG and adds it", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const heic = makeFile("photo.heic", "image/heic", 100);
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([heic]));
    });
    await waitFor(() => {
      expect(result.current.images).toHaveLength(1);
    });
    expect(result.current.images[0].name).toBe("photo.jpg");
  });

  it("ignores null file selection (e.target.files === null)", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const event = {
      target: { files: null },
      currentTarget: { files: null },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      await result.current.handleChange(event);
    });
    expect(result.current.images).toHaveLength(0);
  });

  it("ignores empty file selection", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([]));
    });
    expect(result.current.images).toHaveLength(0);
  });

  it("ignores re-entry while converting", async () => {
    const heic2anyModule = await import("heic2any");
    vi.mocked(heic2anyModule.default).mockClear();
    let resolveConv!: (blob: Blob) => void;
    vi.mocked(heic2anyModule.default).mockReturnValueOnce(
      new Promise<Blob>((r) => {
        resolveConv = r;
      }),
    );
    const { result } = renderHook(() => useContactImageHandler());
    const heic = makeFile("a.heic", "image/heic");

    let first!: Promise<void>;
    act(() => {
      first = result.current.handleChange(makeChangeEvent([heic]));
    });
    await waitFor(() => expect(result.current.isConverting).toBe(true));

    await act(async () => {
      await result.current.handleChange(makeChangeEvent([heic]));
    });

    await act(async () => {
      resolveConv(new Blob(["jpeg"], { type: "image/jpeg" }));
      await first;
    });

    expect(result.current.images).toHaveLength(1);
    expect(vi.mocked(heic2anyModule.default)).toHaveBeenCalledTimes(1);
  });

  it("removes image by index", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const file = makeFile("a.jpg", "image/jpeg");
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([file]));
    });
    expect(result.current.images).toHaveLength(1);
    act(() => {
      result.current.handleRemove(0);
    });
    expect(result.current.images).toHaveLength(0);
  });

  it("resets state", async () => {
    const { result } = renderHook(() => useContactImageHandler());
    const file = makeFile("a.jpg", "image/jpeg");
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([file]));
    });
    expect(result.current.images).toHaveLength(1);
    act(() => {
      result.current.reset();
    });
    expect(result.current.images).toHaveLength(0);
  });

  it("syncs file input element with the processed (converted) files", async () => {
    function TestHarness(): React.ReactElement {
      const handler = useContactImageHandler();
      return (
        <input
          ref={handler.fileInputRef}
          type="file"
          data-testid="files"
          onChange={handler.handleChange}
          multiple
        />
      );
    }

    const { getByTestId } = render(<TestHarness />);
    const input = getByTestId("files") as HTMLInputElement;
    // Pre-fill with a HEIC file; after processing the sync must replace it
    // with the converted .jpg, so the assertion is not pre-satisfied.
    const selected = makeFile("photo.heic", "image/heic");

    Object.defineProperty(input, "files", {
      writable: true,
      configurable: true,
      value: Object.assign([selected], {
        item: (i: number) => [selected][i] ?? null,
      }) as unknown as FileList,
    });

    await act(async () => {
      fireEvent.change(input);
    });

    await waitFor(() => {
      expect(input.files?.length).toBe(1);
    });
    expect(input.files?.[0].name).toBe("photo.jpg");
    expect(input.files?.[0].type).toBe("image/jpeg");
  });

  it("falls back when HEIC conversion throws", async () => {
    const heic2anyModule = await import("heic2any");
    vi.mocked(heic2anyModule.default).mockRejectedValueOnce(
      new Error("decode fail"),
    );
    const { result } = renderHook(() => useContactImageHandler());
    const heic = makeFile("bad.heic", "image/heic");
    await act(async () => {
      await result.current.handleChange(makeChangeEvent([heic]));
    });
    expect(result.current.images).toHaveLength(0);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  describe("with bound input element", () => {
    function TestHarness({
      onReady,
    }: {
      onReady: (handler: ReturnType<typeof useContactImageHandler>) => void;
    }): React.ReactElement {
      const handler = useContactImageHandler();
      onReady(handler);
      return (
        <input
          ref={handler.fileInputRef}
          type="file"
          data-testid="files"
          multiple
        />
      );
    }

    function mountHarness(): {
      input: HTMLInputElement;
      getHandler: () => ReturnType<typeof useContactImageHandler>;
    } {
      let handlerRef: ReturnType<typeof useContactImageHandler> | null = null;
      const { getByTestId } = render(
        <TestHarness
          onReady={(h) => {
            handlerRef = h;
          }}
        />,
      );
      return {
        input: getByTestId("files") as HTMLInputElement,
        getHandler: () => {
          if (!handlerRef) throw new Error("handler not ready");
          return handlerRef;
        },
      };
    }

    it("clears file input value when count exceeded", async () => {
      const { input, getHandler } = mountHarness();
      await act(async () => {
        await getHandler().handleChange(
          makeChangeEvent([
            makeFile("1.jpg", "image/jpeg"),
            makeFile("2.jpg", "image/jpeg"),
            makeFile("3.jpg", "image/jpeg"),
            makeFile("4.jpg", "image/jpeg"),
            makeFile("5.jpg", "image/jpeg"),
          ]),
        );
      });
      expect(input.value).toBe("");
    });

    it("clears file input value when MIME rejected", async () => {
      const { input, getHandler } = mountHarness();
      await act(async () => {
        await getHandler().handleChange(
          makeChangeEvent([makeFile("a.pdf", "application/pdf")]),
        );
      });
      expect(input.value).toBe("");
    });

    it("clears file input value when HEIC conversion fails", async () => {
      const heic2anyModule = await import("heic2any");
      vi.mocked(heic2anyModule.default).mockRejectedValueOnce(
        new Error("decode fail"),
      );
      const { input, getHandler } = mountHarness();
      await act(async () => {
        await getHandler().handleChange(
          makeChangeEvent([makeFile("bad.heic", "image/heic")]),
        );
      });
      expect(input.value).toBe("");
    });

    it("clears file input value on reset", async () => {
      const { input, getHandler } = mountHarness();
      await act(async () => {
        await getHandler().handleChange(
          makeChangeEvent([makeFile("a.jpg", "image/jpeg")]),
        );
      });
      act(() => {
        getHandler().reset();
      });
      expect(input.value).toBe("");
    });
  });
});
