"use client";

import { useEffect, useRef, useState } from "react";

interface UseImageUploadResult {
  images: File[];
  previewUrls: string[];
  addFiles: (files: File[]) => void;
  removeAt: (index: number) => void;
  clear: () => void;
}

export function useImageUpload(maxCount = 15): UseImageUploadResult {
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  function addFiles(files: File[]): void {
    const merged = [...images, ...files];
    if (merged.length > maxCount) return;
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setImages(merged);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  }

  function removeAt(index: number): void {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function clear(): void {
    for (const url of previewUrls) URL.revokeObjectURL(url);
    setImages([]);
    setPreviewUrls([]);
  }

  return { images, previewUrls, addFiles, removeAt, clear };
}
