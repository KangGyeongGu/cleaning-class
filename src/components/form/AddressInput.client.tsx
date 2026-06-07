"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { MapPin, Search, Loader2, X } from "lucide-react";

const DaumPostcode = dynamic(() => import("react-daum-postcode"), {
  ssr: false,
});

interface AddressInputProps {
  label: string;
  required?: boolean;
  addressName: string;
  detailName: string;
  defaultAddress?: string;
  defaultDetail?: string;
  error?: string;
  onChange?: (address: string, detail: string) => void;
}

export function AddressInput({
  label,
  required,
  addressName,
  detailName,
  defaultAddress = "",
  defaultDetail = "",
  error,
  onChange,
}: AddressInputProps): React.ReactElement {
  const [address, setAddress] = useState(defaultAddress);
  const [detail, setDetail] = useState(defaultDetail);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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
    setHint(null);
  }

  function handleCurrentLocation(): void {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setHint("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setHint(null);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const params = new URLSearchParams({
            lat: String(pos.coords.latitude),
            lng: String(pos.coords.longitude),
          });
          const res = await fetch(`/api/reverse-geocode?${params.toString()}`);
          if (!res.ok) {
            setHint("주소 변환에 실패했어요. 직접 입력해 주세요.");
            return;
          }
          const data = (await res.json()) as { address?: string };
          if (data.address) {
            commitAddress(data.address);
          } else {
            setHint("주소를 찾지 못했어요. 직접 입력해 주세요.");
          }
        } catch {
          setHint("주소 변환 중 오류가 발생했어요.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setHint("위치 권한이 거부되었어요. 직접 입력해 주세요.");
        } else {
          setHint("현재 위치를 가져올 수 없어요. 직접 입력해 주세요.");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
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
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={gpsLoading}
            aria-label="현재 위치"
            title="현재 위치"
            className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            {gpsLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MapPin size={14} />
            )}
          </button>
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
      />

      {hint && <p className="form-error mt-1">{hint}</p>}
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
              <DaumPostcode
                onComplete={handleSelectComplete}
                style={{ height: 480 }}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
