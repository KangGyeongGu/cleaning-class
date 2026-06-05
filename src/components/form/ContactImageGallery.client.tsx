"use client";

import Image from "next/image";
import { Plus, X } from "lucide-react";

interface ContactImageGalleryProps {
  images: File[];
  previewUrls: string[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAt: (index: number) => void;
  fileInputRef?: React.Ref<HTMLInputElement>;
  maxCount?: number;
}

export function ContactImageGallery({
  images,
  previewUrls,
  onAdd,
  onRemoveAt,
  fileInputRef,
  maxCount = 15,
}: ContactImageGalleryProps): React.ReactElement {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs leading-relaxed text-slate-500">
        선택입니다. 현재 상태가 보이는 사진을 함께 보내주시면
        <br className="hidden sm:block" /> 더 정확한 견적을 빠르게 드릴 수
        있어요. (전체 공간 + 특히 신경 쓰이는 부분)
      </p>
      <div className="flex items-center gap-4">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="group/image relative h-20 w-20"
              >
                <Image
                  src={previewUrls[index]}
                  alt={`첨부 이미지 ${index + 1}`}
                  fill
                  unoptimized
                  sizes="80px"
                  className="border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveAt(index)}
                  aria-label="이미지 삭제"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition-opacity md:opacity-0 md:group-hover/image:opacity-100"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="group/add flex shrink-0 cursor-pointer items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border border-slate-200 text-slate-400 transition-colors group-hover/add:border-slate-900 group-hover/add:text-slate-900">
            <Plus size={20} />
          </div>
          <span className="text-xs text-slate-400 transition-colors group-hover/add:text-slate-600">
            이미지 첨부 (선택, {images.length}/{maxCount})
          </span>
          <input
            ref={fileInputRef}
            type="file"
            name="images"
            className="hidden"
            accept="image/*"
            multiple
            onChange={onAdd}
          />
        </label>
      </div>
    </div>
  );
}
