"use client";

import Image from "next/image";
import { Plus } from "lucide-react";

interface ImageUploadFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  previewUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectLabel?: string;
  replaceLabel?: string;
  previewSize?: "sm" | "md" | "lg";
  error?: string;
  children?: React.ReactNode;
}

const PREVIEW_CLASS = {
  sm: "h-48 w-full max-w-sm",
  md: "h-64 w-full max-w-md",
  lg: "aspect-video w-full max-w-md",
};

const PREVIEW_SIZES = {
  sm: "(max-width: 768px) 100vw, 384px",
  md: "(max-width: 768px) 100vw, 448px",
  lg: "(max-width: 768px) 100vw, 448px",
};

export function ImageUploadField({
  id,
  name,
  label,
  required,
  previewUrl,
  onChange,
  selectLabel = "이미지 선택",
  replaceLabel = "이미지 변경",
  previewSize = "md",
  error,
  children,
}: ImageUploadFieldProps): React.ReactElement {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <label
        htmlFor={id}
        className="mb-4 inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
      >
        <Plus size={16} />
        {previewUrl ? replaceLabel : selectLabel}
      </label>
      {previewUrl && (
        <div
          className={`relative ${PREVIEW_CLASS[previewSize]} border border-slate-200`}
        >
          <Image
            src={previewUrl}
            alt={`${label} 미리보기`}
            fill
            className="object-cover"
            sizes={PREVIEW_SIZES[previewSize]}
            unoptimized
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {children}
    </div>
  );
}
