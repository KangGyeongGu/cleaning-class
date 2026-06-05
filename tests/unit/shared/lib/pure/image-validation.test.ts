import { describe, it, expect } from "vitest";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_UPLOAD_SIZE,
  getFileExtensionLower,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isValidImageMagicBytes,
} from "@/shared/lib/pure/image-validation";

describe("image-validation constants", () => {
  it("exposes allowed mime types and extensions", () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_EXTENSIONS).toContain("jpg");
    expect(MAX_IMAGE_UPLOAD_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe("isAllowedImageMimeType", () => {
  it("returns true for allowed mime types", () => {
    expect(isAllowedImageMimeType("image/jpeg")).toBe(true);
    expect(isAllowedImageMimeType("image/png")).toBe(true);
    expect(isAllowedImageMimeType("image/webp")).toBe(true);
    expect(isAllowedImageMimeType("image/gif")).toBe(true);
    expect(isAllowedImageMimeType("image/avif")).toBe(true);
  });

  it("returns false for unknown mime types", () => {
    expect(isAllowedImageMimeType("application/pdf")).toBe(false);
    expect(isAllowedImageMimeType("")).toBe(false);
  });
});

describe("isAllowedImageExtension", () => {
  it("returns true for allowed extensions", () => {
    expect(isAllowedImageExtension("jpg")).toBe(true);
    expect(isAllowedImageExtension("png")).toBe(true);
    expect(isAllowedImageExtension("webp")).toBe(true);
  });

  it("returns false for unknown extensions", () => {
    expect(isAllowedImageExtension("pdf")).toBe(false);
    expect(isAllowedImageExtension("")).toBe(false);
  });
});

describe("getFileExtensionLower", () => {
  it("extracts the lowercase extension", () => {
    expect(getFileExtensionLower("photo.JPG")).toBe("jpg");
    expect(getFileExtensionLower("a.b.c.PNG")).toBe("png");
  });

  it("returns empty string when there is no dot", () => {
    expect(getFileExtensionLower("noext")).toBe("");
  });
});

describe("isValidImageMagicBytes", () => {
  it("matches JPEG magic bytes", () => {
    const buf = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(true);
  });

  it("matches PNG magic bytes", () => {
    const buf = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(true);
  });

  it("matches WebP (RIFF) magic bytes", () => {
    const buf = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(true);
  });

  it("matches GIF magic bytes", () => {
    const buf = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(true);
  });

  it("matches AVIF ftyp box pattern", () => {
    const buf = new Uint8Array([
      0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(true);
  });

  it("returns false for unknown content", () => {
    const buf = new Uint8Array([
      0x01, 0x02, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isValidImageMagicBytes(buf)).toBe(false);
  });

  it("returns false for short headers without ftyp match", () => {
    const buf = new Uint8Array([0x01, 0x02, 0x03]);
    expect(isValidImageMagicBytes(buf)).toBe(false);
  });
});
