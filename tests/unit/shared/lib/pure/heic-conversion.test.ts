import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isHeicFile,
  convertHeicToJpeg,
} from "@/shared/lib/pure/heic-conversion";

vi.mock("heic2any", () => ({
  default: vi.fn(async () => new Blob(["jpeg"], { type: "image/jpeg" })),
}));

function makeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("isHeicFile", () => {
  it("returns true for image/heic MIME", () => {
    expect(isHeicFile(makeFile("a.heic", "image/heic"))).toBe(true);
  });

  it("returns true for image/heif MIME", () => {
    expect(isHeicFile(makeFile("a.heif", "image/heif"))).toBe(true);
  });

  it("returns true for image/heic-sequence MIME", () => {
    expect(isHeicFile(makeFile("a.heic", "image/heic-sequence"))).toBe(true);
  });

  it("returns true for image/heif-sequence MIME", () => {
    expect(isHeicFile(makeFile("a.heif", "image/heif-sequence"))).toBe(true);
  });

  it("returns true for .heic extension when MIME is empty", () => {
    expect(isHeicFile(makeFile("photo.HEIC", ""))).toBe(true);
  });

  it("returns true for .heif extension when MIME is empty", () => {
    expect(isHeicFile(makeFile("photo.heif", ""))).toBe(true);
  });

  it("returns false for plain JPEG file", () => {
    expect(isHeicFile(makeFile("photo.jpg", "image/jpeg"))).toBe(false);
  });

  it("returns false for plain PNG file", () => {
    expect(isHeicFile(makeFile("photo.png", "image/png"))).toBe(false);
  });
});

describe("convertHeicToJpeg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts HEIC file to JPEG with .jpg extension", async () => {
    const heicFile = makeFile("photo.heic", "image/heic");
    const result = await convertHeicToJpeg(heicFile);
    expect(result.name).toBe("photo.jpg");
    expect(result.type).toBe("image/jpeg");
  });

  it("preserves base name when renaming .HEIC to .jpg", async () => {
    const heicFile = makeFile("vacation.HEIC", "image/heic");
    const result = await convertHeicToJpeg(heicFile);
    expect(result.name).toBe("vacation.jpg");
  });

  it("renames .heif extension to .jpg", async () => {
    const heifFile = makeFile("photo.heif", "image/heif");
    const result = await convertHeicToJpeg(heifFile);
    expect(result.name).toBe("photo.jpg");
  });

  it("handles array result by taking first blob", async () => {
    const { default: heic2any } = await import("heic2any");
    vi.mocked(heic2any).mockResolvedValueOnce([
      new Blob(["first"], { type: "image/jpeg" }),
      new Blob(["second-longer"], { type: "image/jpeg" }),
    ]);
    const heicFile = makeFile("photo.heic", "image/heic");
    const result = await convertHeicToJpeg(heicFile);
    expect(result.name).toBe("photo.jpg");
    // "first" is 5 bytes vs "second-longer" 13 bytes → confirms first blob taken
    expect(result.size).toBe(5);
    expect(heic2any).toHaveBeenCalledWith({
      blob: heicFile,
      toType: "image/jpeg",
      quality: 0.85,
    });
  });
});
