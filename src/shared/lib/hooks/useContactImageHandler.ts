import { useState, useRef } from "react";
import {
  CONTACT_MAX_IMAGE_COUNT,
  validateContactImageFile,
} from "@/shared/lib/pure/image-validation";
import {
  isHeicFile,
  convertHeicToJpeg,
} from "@/shared/lib/pure/heic-conversion";
import { useImageUpload } from "@/shared/lib/hooks/useImageUpload";

export interface ContactImageHandler {
  images: File[];
  previewUrls: string[];
  isConverting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemove: (index: number) => void;
  reset: () => void;
}

export function useContactImageHandler(): ContactImageHandler {
  const { images, previewUrls, addFiles, removeAt, clear } = useImageUpload(
    CONTACT_MAX_IMAGE_COUNT,
  );
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function syncFileInputDataTransfer(files: File[]): void {
    const input = fileInputRef.current;
    if (!input || typeof DataTransfer === "undefined") return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    try {
      input.files = dt.files;
    } catch {
      void 0;
    }
  }

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    /* v8 ignore next */
    if (isConverting) return;
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;

    if (images.length + incoming.length > CONTACT_MAX_IMAGE_COUNT) {
      alert(`이미지는 최대 ${CONTACT_MAX_IMAGE_COUNT}장까지 첨부 가능합니다.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const hasHeic = incoming.some(isHeicFile);
    if (hasHeic) setIsConverting(true);

    try {
      const processed: File[] = [];
      for (const file of incoming) {
        try {
          const next = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
          const result = validateContactImageFile(next);
          if (!result.ok) {
            alert(result.message);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          processed.push(next);
        } catch {
          alert(`이미지 변환에 실패했습니다. (${file.name})`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      addFiles(processed);
      syncFileInputDataTransfer([...images, ...processed]);
    } finally {
      setIsConverting(false);
    }
  }

  function handleRemove(index: number): void {
    const next = images.filter((_, i) => i !== index);
    removeAt(index);
    syncFileInputDataTransfer(next);
  }

  function reset(): void {
    clear();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return {
    images,
    previewUrls,
    isConverting,
    fileInputRef,
    handleChange,
    handleRemove,
    reset,
  };
}
