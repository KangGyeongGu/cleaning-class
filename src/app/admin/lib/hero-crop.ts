import type { HeroCrop } from "@/shared/lib/domain/hero-images";

export async function exportHeroCrop(
  source: string,
  area: HeroCrop,
): Promise<File> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("이미지를 불러오지 못했습니다.");
  const bitmap = await createImageBitmap(await response.blob(), {
    imageOrientation: "from-image",
  });
  try {
    if (
      !Object.values(area).every(Number.isFinite) ||
      area.width <= 0 ||
      area.height <= 0 ||
      area.left < 0 ||
      area.top < 0 ||
      area.left + area.width > bitmap.width + 1 ||
      area.top + area.height > bitmap.height + 1
    )
      throw new Error("이미지 영역을 다시 선택해주세요.");
    const scale = Math.min(1, 1920 / Math.max(area.width, area.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(area.width * scale));
    canvas.height = Math.max(1, Math.round(area.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지를 처리하지 못했습니다.");
    context.drawImage(
      bitmap,
      area.left,
      area.top,
      area.width,
      area.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("이미지를 처리하지 못했습니다.")),
        "image/webp",
        0.92,
      ),
    );
    return new File(
      [blob],
      `hero-cropped.${blob.type === "image/webp" ? "webp" : "png"}`,
      { type: blob.type },
    );
  } finally {
    bitmap.close();
  }
}
