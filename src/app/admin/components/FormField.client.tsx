"use client";

import { Loader2 } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue: string;
  error?: string;
  placeholder?: string;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
}

export function FormField({
  id,
  label,
  required,
  type = "text",
  defaultValue,
  error,
  placeholder,
  onInput,
}: FormFieldProps): React.ReactElement {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        defaultValue={defaultValue}
        onInput={onInput}
        placeholder={placeholder}
        className="w-full border-b border-slate-200 bg-transparent pb-3 text-base font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface ModalFooterProps {
  isPending: boolean;
  onCancel: () => void;
  submitLabel?: string;
}

export function ModalFooter({
  isPending,
  onCancel,
  submitLabel = "저장",
}: ModalFooterProps): React.ReactElement {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="px-5 py-2.5 text-xs font-bold tracking-widest text-slate-600 uppercase transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-slate-900 px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
