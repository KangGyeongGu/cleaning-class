"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Pencil, Trash2, Upload, ImageOff } from "lucide-react";
import { updateHeroImage } from "@/shared/actions/site-config";
import { getHeroImageUrl } from "@/shared/lib/supabase/storage";
import { FocalPointPicker } from "@/app/admin/components/FocalPointPicker.client";
import { Modal } from "@/app/admin/components/Modal.client";
import type { SiteConfig } from "@/shared/types/database";

type HeroActionState = Awaited<ReturnType<typeof updateHeroImage>>;

const HERO_BANNER_RATIO = 2.5;

interface HeroImageCardProps {
  config: SiteConfig;
}

interface SlotData {
  slot: "1" | "2";
  label: string;
  imagePath: string | null;
  focalX: number;
  focalY: number;
}

function buildSlots(config: SiteConfig): SlotData[] {
  return [
    {
      slot: "1",
      label: "좌측 이미지",
      imagePath: config.hero_image_path ?? null,
      focalX: config.hero_image_focal_x ?? 50,
      focalY: config.hero_image_focal_y ?? 50,
    },
    {
      slot: "2",
      label: "우측 이미지",
      imagePath: config.hero_image_path_2 ?? null,
      focalX: config.hero_image_focal_x_2 ?? 50,
      focalY: config.hero_image_focal_y_2 ?? 50,
    },
  ];
}

export function HeroImageCard({
  config,
}: HeroImageCardProps): React.ReactElement {
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null);
  const slots = buildSlots(config);

  return (
    <section className="border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">히어로 배경이미지</h2>
        <p className="mt-1 text-xs font-light text-slate-500">
          메인 페이지 히어로 배너의 배경이미지입니다. 최대 2장(좌/우),
          JPG/PNG/WebP, 최대 10MB.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-2">
        {slots.map((s) => (
          <SlotPreview key={s.slot} slot={s} onEdit={setEditingSlot} />
        ))}
      </div>

      {editingSlot && (
        <HeroSlotEditModal
          key={editingSlot.slot}
          slot={editingSlot}
          isOpen
          onClose={() => setEditingSlot(null)}
        />
      )}
    </section>
  );
}

interface SlotPreviewProps {
  slot: SlotData;
  onEdit: (s: SlotData) => void;
}

function SlotPreview({ slot, onEdit }: SlotPreviewProps): React.ReactElement {
  const imageUrl = slot.imagePath ? getHeroImageUrl(slot.imagePath) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-widest text-slate-900 uppercase">
          {slot.label}
        </p>
        <button
          type="button"
          onClick={() => onEdit(slot)}
          className="inline-flex items-center gap-1.5 border border-slate-300 px-3 py-1.5 text-xs font-bold tracking-widest text-slate-700 uppercase transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </button>
      </div>
      <div
        className="relative w-full overflow-hidden border border-slate-100 bg-slate-50"
        style={{ aspectRatio: HERO_BANNER_RATIO }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={slot.label}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{
              objectFit: "cover",
              objectPosition: `${slot.focalX}% ${slot.focalY}%`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs font-light">등록된 이미지 없음</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface HeroSlotEditModalProps {
  slot: SlotData;
  isOpen: boolean;
  onClose: () => void;
}

function HeroSlotEditModal({
  slot,
  isOpen,
  onClose,
}: HeroSlotEditModalProps): React.ReactElement {
  const [state, setState] = useState<HeroActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [focalX, setFocalX] = useState(slot.focalX);
  const [focalY, setFocalY] = useState(slot.focalY);
  const prevBlobRef = useRef<string | null>(null);

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await updateHeroImage(state, formData);
      setState(result);
      if (result && "message" in result && result.message) {
        onClose();
      }
    });
  }

  useEffect(() => {
    return () => {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    };
  }, []);

  const currentImageUrl = slot.imagePath
    ? getHeroImageUrl(slot.imagePath)
    : null;
  const displayImageUrl = previewUrl ?? currentImageUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    if (!file) {
      setPreviewUrl(null);
      prevBlobRef.current = null;
      return;
    }
    const url = URL.createObjectURL(file);
    prevBlobRef.current = url;
    setPreviewUrl(url);
    setFocalX(50);
    setFocalY(50);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${slot.label} 수정`}
      description="이미지 선택 후 초점을 조정해 저장하세요."
      size="lg"
    >
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="slot" value={slot.slot} />
        <input type="hidden" name="focal_x" value={focalX} />
        <input type="hidden" name="focal_y" value={focalY} />

        <FocalPointPicker
          key={displayImageUrl}
          imageUrl={displayImageUrl}
          focalX={focalX}
          focalY={focalY}
          onChange={(x, y) => {
            setFocalX(x);
            setFocalY(y);
          }}
          label={slot.label}
          targetRatio={HERO_BANNER_RATIO}
        />

        <div>
          <label
            htmlFor={`hero_image_${slot.slot}`}
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            이미지 선택
          </label>
          <input
            id={`hero_image_${slot.slot}`}
            name="hero_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm font-light text-slate-600 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-widest file:text-white file:uppercase hover:file:bg-slate-800"
          />
        </div>

        {state && "error" in state && state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-5">
          {currentImageUrl ? (
            <button
              type="submit"
              name="delete_hero_image"
              value="true"
              disabled={isPending}
              className="inline-flex items-center gap-2 border border-slate-300 px-5 py-2.5 text-xs font-bold tracking-widest text-slate-600 uppercase transition-colors hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
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
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              저장
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
