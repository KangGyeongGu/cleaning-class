import { useEffect, useRef, useState } from "react";
import { validateContactImageFile } from "@/shared/lib/pure/image-validation";
import {
  isHeicFile,
  convertHeicToJpeg,
} from "@/shared/lib/pure/heic-conversion";

export interface SingleImagePreview {
  previewUrl: string | null;
  isConverting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useSingleImagePreview(): SingleImagePreview {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  function showPreview(url: string | null): void {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) {
      showPreview(null);
      return;
    }

    setIsConverting(true);
    try {
      let next = file;
      if (isHeicFile(file)) {
        try {
          next = await convertHeicToJpeg(file);
        } catch {
          alert(`이미지 변환에 실패했습니다. (${file.name})`);
          input.value = "";
          showPreview(null);
          return;
        }
      }

      const result = validateContactImageFile(next);
      if (!result.ok) {
        alert(result.message);
        input.value = "";
        showPreview(null);
        return;
      }

      if (next !== file && typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(next);
        try {
          input.files = dt.files;
        } catch {
          void 0;
        }
      }

      showPreview(URL.createObjectURL(next));
    } finally {
      setIsConverting(false);
    }
  }

  return { previewUrl, isConverting, handleChange };
}
