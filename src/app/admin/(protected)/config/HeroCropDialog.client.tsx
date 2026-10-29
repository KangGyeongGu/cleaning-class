"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Cropper,
  ImageRestriction,
  type CropperRef,
  type CropperState,
} from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { ImagePlus, Minus, Plus } from "lucide-react";
import { Modal } from "@/app/admin/components/Modal.client";
import { AdminButton } from "@/app/admin/components/AdminButton";
import { updateHeroImage } from "@/shared/actions/site-config-hero";
import { MAX_IMAGE_UPLOAD_SIZE } from "@/shared/lib/pure/image-validation";
import { useUnsavedChanges } from "@/app/admin/lib/useUnsavedChanges";
import { exportHeroCrop } from "@/app/admin/lib/hero-crop";
import {
  heroAssetJson,
  type HeroAsset,
  type HeroCrop,
  type HeroDevice,
  type HeroSide,
} from "@/shared/lib/domain/hero-images";

export interface HeroImageSlot {
  device: HeroDevice;
  side: HeroSide;
  label: string;
  asset: HeroAsset | null;
}

type Ratio = "free" | "original" | "16:9" | "4:3" | "1:1";
const RATIOS: Record<Exclude<Ratio, "free" | "original">, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
};

export function HeroCropDialog({
  slot,
  onClose,
}: {
  slot: HeroImageSlot;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const ratioId = useId();
  const cropper = useRef<CropperRef>(null);
  const blobUrl = useRef<string | null>(null);
  const [source, setSource] = useState("");
  const [area, setArea] = useState<HeroCrop | null>(null);
  const [originalRatio, setOriginalRatio] = useState(1);
  const [ratio, setRatio] = useState<Ratio>("free");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const saving = useRef(false);
  useUnsavedChanges(dirty, pending);

  useEffect(
    () => () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    },
    [],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      cropper.current?.reconcileState();
      setArea(cropper.current?.getCoordinates() ?? null);
    });
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  function close() {
    if (
      !saving.current &&
      (!dirty || window.confirm("변경사항을 저장하지 않고 취소하시겠습니까?"))
    )
      onClose();
  }
  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_IMAGE_UPLOAD_SIZE
    ) {
      setError("JPG · PNG · WebP, 10MB 이하 이미지를 선택해주세요.");
      event.target.value = "";
      return;
    }
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = URL.createObjectURL(file);
    setSource(blobUrl.current);
    setArea(null);
    setRatio("free");
    setError(undefined);
    setDirty(true);
    event.target.value = "";
  }
  function save() {
    const coordinates = cropper.current?.getCoordinates();
    if (saving.current || !source || !coordinates) return;
    saving.current = true;
    setError(undefined);
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set("device", slot.device);
        data.set("side", slot.side);
        data.set("expected", JSON.stringify(heroAssetJson(slot.asset)));
        data.set("hero_image", await exportHeroCrop(source, coordinates));
        const result = await updateHeroImage(null, data);
        if (result.success) {
          onClose();
          router.refresh();
        } else
          setError(result.error ?? "저장하지 못했습니다. 다시 시도해주세요.");
      } catch {
        setError("이미지를 처리하거나 저장하지 못했습니다. 다시 시도해주세요.");
      } finally {
        saving.current = false;
      }
    });
  }

  return (
    <Modal
      isOpen
      title={slot.label}
      onClose={close}
      onEscape={close}
      closeDisabled={pending}
      size="xl"
      headerDivider={false}
      bodyClassName="min-h-0 overflow-y-auto px-5 pb-5 md:px-6 md:pb-6"
      headerActions={
        <div className="flex gap-2">
          <AdminButton disabled={pending} onClick={close}>
            취소
          </AdminButton>
          <AdminButton
            disabled={pending || !area}
            variant="primary"
            loading={pending}
            onClick={save}
          >
            저장
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className={`relative h-[min(52dvh,32rem)] min-h-48 overflow-hidden bg-slate-950 ${pending ? "pointer-events-none" : ""}`}
          aria-busy={pending}
          aria-label="이미지 크롭 영역"
        >
          {source ? (
            <Cropper
              key={source}
              ref={cropper}
              src={source}
              className="h-full w-full"
              disabled={pending}
              imageRestriction={ImageRestriction.fitArea}
              defaultCoordinates={(state: CropperState) => ({
                left: 0,
                top: 0,
                width: state.imageSize.width,
                height: state.imageSize.height,
              })}
              stencilProps={{
                aspectRatio:
                  ratio === "free"
                    ? undefined
                    : ratio === "original"
                      ? originalRatio
                      : RATIOS[ratio],
                movable: true,
                resizable: true,
                grid: true,
                disabled: pending,
              }}
              backgroundWrapperProps={{
                rotateImage: false,
                scaleImage: { wheel: true, touch: true, adjustStencil: false },
              }}
              onReady={(instance) => {
                const image = instance.getImage();
                if (image) setOriginalRatio(image.width / image.height);
                setArea(instance.getCoordinates());
              }}
              onChange={(instance) => setArea(instance.getCoordinates())}
              onInteractionStart={() => setDirty(true)}
              onError={() => {
                setArea(null);
                setError(
                  "이미지를 불러오지 못했습니다. 다른 사진을 선택해주세요.",
                );
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              이미지를 선택해주세요.
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className={`relative inline-flex h-8 shrink-0 items-center gap-2 rounded-none border border-slate-900 px-3 text-xs leading-4 font-medium text-slate-900 focus-within:ring-1 focus-within:ring-slate-900 ${pending ? "opacity-50" : "hover:bg-slate-50"}`}
            >
              <ImagePlus size={14} aria-hidden="true" />
              {source ? "이미지 변경" : "이미지 선택"}
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={source ? "이미지 변경" : "이미지 선택"}
                disabled={pending}
                onChange={selectImage}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <label htmlFor={ratioId} className="sr-only">
              크롭 비율
            </label>
            <select
              id={ratioId}
              value={ratio}
              disabled={pending || !area}
              onChange={(event) => {
                setRatio(event.target.value as Ratio);
                setDirty(true);
              }}
              className="h-8 rounded-none border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="free">자유 비율</option>
              <option value="original">원본 비율</option>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {area && (
              <output
                aria-label="선택 영역 크기"
                className="mr-1 text-xs text-slate-500 tabular-nums"
              >
                {Math.round(area.width)} × {Math.round(area.height)}
              </output>
            )}
            <AdminButton
              aria-label="축소"
              disabled={pending || !area}
              onClick={() => {
                cropper.current?.zoomImage(0.8);
                setDirty(true);
              }}
            >
              <Minus size={14} />
            </AdminButton>
            <AdminButton
              aria-label="확대"
              disabled={pending || !area}
              onClick={() => {
                cropper.current?.zoomImage(1.25);
                setDirty(true);
              }}
            >
              <Plus size={14} />
            </AdminButton>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
