"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";

const DaumPostcode = dynamic(() => import("react-daum-postcode"), {
  ssr: false,
});

interface AddressInputProps {
  label: string;
  required?: boolean;
  addressName: string;
  detailName: string;
  error?: string;
  onChange?: (address: string, detail: string) => void;
}

export function AddressInput({
  label,
  required,
  addressName,
  detailName,
  error,
  onChange,
}: AddressInputProps): React.ReactElement {
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function commitAddress(next: string): void {
    setAddress(next);
    onChange?.(next, detail);
  }

  function commitDetail(next: string): void {
    setDetail(next);
    onChange?.(address, next);
  }

  function handleSelectComplete(data: { address: string }): void {
    commitAddress(data.address);
    setPickerOpen(false);
  }

  return (
    <div>
      <label className="form-label-sm">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          name={addressName}
          value={address}
          required={required}
          readOnly
          onClick={() => setPickerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPickerOpen(true);
            }
          }}
          className="form-input cursor-pointer pr-20"
          placeholder="주소 검색"
          data-clarity-mask="True"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="주소 검색"
            title="주소 검색"
            className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Search size={14} />
          </button>
        </div>
      </div>
      <input
        type="text"
        name={detailName}
        value={detail}
        onChange={(e) => commitDetail(e.target.value)}
        className="form-input mt-2"
        placeholder="선택사항: 상세 주소 (동·호수)"
        data-clarity-mask="True"
      />

      {error && <p className="form-error mt-1">{error}</p>}

      {pickerOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPickerOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPickerOpen(false);
            }}
            role="presentation"
          >
            <div
              className="w-full max-w-lg bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="주소 검색"
              tabIndex={-1}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <span className="text-sm font-bold text-slate-900">
                  주소 검색
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  aria-label="닫기"
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>
              <div data-clarity-mask="True">
                <DaumPostcode
                  onComplete={handleSelectComplete}
                  style={{ height: 480 }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
