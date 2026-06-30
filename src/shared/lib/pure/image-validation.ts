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

export const CONTACT_MAX_IMAGE_SIZE = 25 * 1024 * 1024;
export const CONTACT_MAX_IMAGE_COUNT = 4;

export interface ContactImageValidationResult {
  ok: boolean;
  message?: string;
}

export function validateContactImageFile(
  file: File,
): ContactImageValidationResult {
  if (file.size > CONTACT_MAX_IMAGE_SIZE) {
    return {
      ok: false,
      message: `개별 이미지 크기는 25MB를 초과할 수 없습니다. (${file.name})`,
    };
  }
  if (!isAllowedImageMimeType(file.type)) {
    return {
      ok: false,
      message: `허용되지 않는 파일 형식입니다: ${file.type}. (${file.name})`,
    };
  }
  const ext = getFileExtensionLower(file.name);
  if (!isAllowedImageExtension(ext)) {
    return {
      ok: false,
      message: `허용되지 않는 파일 확장자입니다. 허용 확장자: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")} (${file.name})`,
    };
  }
  return { ok: true };
}

const IMAGE_MAGIC_BYTES: Array<{ signature: number[]; offset: number }> = [
  { signature: [0xff, 0xd8, 0xff], offset: 0 },
  { signature: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { signature: [0x47, 0x49, 0x46, 0x38], offset: 0 },
];

const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

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
  if (
    RIFF_SIGNATURE.every((byte, i) => header[i] === byte) &&
    WEBP_SIGNATURE.every((byte, i) => header[8 + i] === byte)
  ) {
    return true;
  }
  return IMAGE_MAGIC_BYTES.some(({ signature, offset }) =>
    signature.every((byte, i) => header[offset + i] === byte),
  );
}
