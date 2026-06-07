"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CustomDropdownProps {
  label: string;
  name: string;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange?: (value: string) => void;
}

export function CustomDropdown({
  label,
  name,
  options,
  placeholder,
  required,
  error,
  value,
  onChange,
}: CustomDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  function handleSelect(option: string): void {
    setIsOpen(false);
    onChange?.(option);
  }

  return (
    <div className="group" ref={dropdownRef}>
      <label className="form-label-sm">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-h-9 w-full items-center justify-between border-b border-slate-200 bg-transparent py-2 text-left text-sm font-light transition-colors outline-none focus:border-slate-900"
        >
          <span className={value ? "text-slate-900" : "text-slate-400"}>
            {value || placeholder || "선택해주세요"}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
        {isOpen && (
          <div className="scrollbar-thin absolute z-10 mt-1 max-h-60 w-full overflow-y-auto border border-slate-200 bg-white shadow-lg">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-sm font-light transition-colors hover:bg-slate-50"
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <input type="hidden" name={name} value={value} />
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
