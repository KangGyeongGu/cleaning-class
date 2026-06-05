export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
] as const;

export const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024;

const IMAGE_MAGIC_BYTES: Array<{ signature: number[]; offset: number }> = [
  { signature: [0xff, 0xd8, 0xff], offset: 0 },
  { signature: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { signature: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  { signature: [0x00, 0x00, 0x00], offset: 1 },
];

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];

export function isAllowedImageMimeType(
  value: string,
): value is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function isAllowedImageExtension(
  value: string,
): value is AllowedImageExtension {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(value);
}

export function getFileExtensionLower(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.slice(lastDot + 1).toLowerCase();
}

export function isValidImageMagicBytes(header: Uint8Array): boolean {
  if (
    header.length >= 12 &&
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  ) {
    return true;
  }
  return IMAGE_MAGIC_BYTES.some(({ signature, offset }) =>
    signature.every((byte, i) => header[offset + i] === byte),
  );
}
