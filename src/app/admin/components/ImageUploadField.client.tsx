"use client";

import Image from "next/image";

interface ImageUploadFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  previewUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectLabel?: string;
  replaceLabel?: string;
  previewSize?: "md" | "lg";
  error?: string;
  children?: React.ReactNode;
}

const PREVIEW_CLASS = {
  md: "h-64 w-full max-w-md",
  lg: "aspect-video w-full max-w-md",
};

const PREVIEW_SIZES = {
  md: "(max-width: 768px) 100vw, 448px",
  lg: "(max-width: 768px) 100vw, 448px",
};

export function ImageUploadField({
  id,
  name,
  label,
  required,
  accept = "image/*",
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
      <div className="relative mb-4 inline-flex min-h-11 items-center border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 transition-colors focus-within:ring-1 focus-within:ring-slate-900 hover:border-slate-900">
        <span aria-hidden="true">
          {previewUrl ? replaceLabel : selectLabel}
        </span>
        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>
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
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {children}
    </div>
  );
}
