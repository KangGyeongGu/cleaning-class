import type { ComponentPropsWithRef, ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
}

function controlClass(error?: string): string {
  const border = error
    ? "border-red-500 focus:border-red-600 focus:ring-red-600"
    : "border-slate-300 hover:border-slate-500 focus:border-slate-900 focus:ring-slate-900";
  return `peer block w-full min-w-0 rounded-none border bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:ring-1 focus:ring-inset disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 ${border}`;
}

function FieldFrame({
  id,
  label,
  error,
  required,
  className = "",
  children,
}: FieldProps & { required?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 pt-2 ${className}`}>
      <div className="relative">
        {children}
        <label
          htmlFor={id}
          className={`absolute top-0 left-2 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium peer-disabled:bg-slate-50 peer-disabled:text-slate-400 ${error ? "text-red-600" : "text-slate-500 peer-focus:text-slate-900"}`}
        >
          {label}
          {required && (
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type OutlinedFieldProps = FieldProps &
  Omit<ComponentPropsWithRef<"input">, "id" | "className">;
export function OutlinedField({
  id,
  label,
  error,
  className,
  required,
  ...props
}: OutlinedFieldProps) {
  const describedBy =
    [props["aria-describedby"], error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <FieldFrame
      id={id}
      label={label}
      error={error}
      required={required}
      className={className}
    >
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={describedBy}
        className={`${controlClass(error)} h-11`}
      />
    </FieldFrame>
  );
}
