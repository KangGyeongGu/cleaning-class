import { createClient } from "@/shared/lib/supabase/server";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
] as const;

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

const IMAGE_MAGIC_BYTES: Array<{ signature: number[]; offset: number }> = [
  { signature: [0xff, 0xd8, 0xff], offset: 0 }, // JPEG
  { signature: [0x89, 0x50, 0x4e, 0x47], offset: 0 }, // PNG
  { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // WebP (RIFF header)
  { signature: [0x47, 0x49, 0x46, 0x38], offset: 0 }, // GIF
  { signature: [0x00, 0x00, 0x00], offset: 1 }, // AVIF (ftyp box, offset 4 'ftypavif' — 간이 검사)
];

function isValidImageMagicBytes(header: Uint8Array): boolean {
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

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

function isAllowedExtension(value: string): value is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(value);
}

export async function uploadImage(bucket: string, file: File): Promise<string> {
  if (!isAllowedMimeType(file.type)) {
    throw new Error(
      `허용되지 않는 파일 형식입니다: ${file.type}. 허용 형식: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  const fileExt = file.name.split(".").pop();

  if (fileExt === undefined || !isAllowedExtension(fileExt.toLowerCase())) {
    throw new Error(
      `허용되지 않는 파일 확장자입니다: ${fileExt ?? "(없음)"}. 허용 확장자: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      `파일 크기가 제한을 초과합니다: ${(file.size / 1024 / 1024).toFixed(1)}MB. 최대 허용 크기: 10MB`,
    );
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!isValidImageMagicBytes(header)) {
    throw new Error("파일 내용이 허용된 이미지 형식과 일치하지 않습니다.");
  }

  const supabase = await createClient();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("uploadImage storage error:", error);
    throw new Error("이미지 업로드 중 오류가 발생했습니다.");
  }

  return fileName;
}

export async function deleteImage(
  bucket: string,
  imagePath: string,
): Promise<void> {
  if (!imagePath) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([imagePath]);

  if (error) {
    console.error("이미지 삭제 실패:", error.message);
  }
}
