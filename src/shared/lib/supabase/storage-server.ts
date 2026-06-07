import { createClient } from "@/shared/lib/supabase/server";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_UPLOAD_SIZE,
  getFileExtensionLower,
  isAllowedImageExtension,
  isAllowedImageMimeType,
  isValidImageMagicBytes,
} from "@/shared/lib/pure/image-validation";

export async function uploadImage(bucket: string, file: File): Promise<string> {
  if (!isAllowedImageMimeType(file.type)) {
    throw new Error(
      `허용되지 않는 파일 형식입니다: ${file.type}. 허용 형식: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
    );
  }

  const fileExt = getFileExtensionLower(file.name);
  if (!fileExt || !isAllowedImageExtension(fileExt)) {
    throw new Error(
      `허용되지 않는 파일 확장자입니다: ${fileExt || "(없음)"}. 허용 확장자: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
    );
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
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
