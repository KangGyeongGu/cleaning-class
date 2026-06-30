"use client";

import Image from "next/image";
import { Plus, X } from "lucide-react";

interface ContactImageGalleryProps {
  images: File[];
  previewUrls: string[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAt: (index: number) => void;
  fileInputRef?: React.Ref<HTMLInputElement>;
}

export function ContactImageGallery({
  images,
  previewUrls,
  onAdd,
  onRemoveAt,
  fileInputRef,
}: ContactImageGalleryProps): React.ReactElement {
  return (
    <div className="group">
      <div className="form-label-sm">
        이미지 첨부
        <span className="ml-2 text-xs font-normal text-slate-400">
          (개별 25MB, 최대 4장)
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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

        <label className="group/add flex shrink-0 cursor-pointer items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border border-slate-200 text-slate-400 transition-colors group-hover/add:border-slate-900 group-hover/add:text-slate-900">
            <Plus size={20} />
          </div>
          <span className="text-xs text-slate-400 transition-colors group-hover/add:text-slate-600">
            {images.length}/4
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
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        문의 내용과 연관된 사진을 함께 첨부해주시면 더 빠른 답변 및 상담이
        가능합니다.
      </p>
    </div>
  );
}
