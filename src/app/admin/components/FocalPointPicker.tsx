"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface FocalPointPickerProps {
  imageUrl: string | null;
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
  label?: string;

  targetRatio?: number;
}

const DEFAULT_targetRatio = 3 / 4;

export function FocalPointPicker({
  imageUrl,
  focalX,
  focalY,
  onChange,
  label,
  targetRatio = DEFAULT_targetRatio,
}: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startFocalX: number;
    startFocalY: number;
  } | null>(null);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    },
    [],
  );

  const getGuideRect = useCallback(() => {
    if (!naturalSize) return null;

    const imageRatio = naturalSize.w / naturalSize.h;

    let guideW: number;
    let guideH: number;

    if (imageRatio > targetRatio) {
      guideH = 1;
      guideW = targetRatio / imageRatio;
    } else if (imageRatio < targetRatio) {
      guideW = 1;
      guideH = imageRatio / targetRatio;
    } else {
      return { x: 0, y: 0, w: 1, h: 1, canDragX: false, canDragY: false };
    }

    const maxOffsetX = 1 - guideW;
    const maxOffsetY = 1 - guideH;
    const x = (focalX / 100) * maxOffsetX;
    const y = (focalY / 100) * maxOffsetY;

    return {
      x,
      y,
      w: guideW,
      h: guideH,
      canDragX: maxOffsetX > 0.001,
      canDragY: maxOffsetY > 0.001,
    };
  }, [naturalSize, focalX, focalY, targetRatio]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragStartRef.current = {
        startMouseX: clientX,
        startMouseY: clientY,
        startFocalX: focalX,
        startFocalY: focalY,
      };
      setDragging(true);
    },
    [focalX, focalY],
  );

  useEffect(() => {
    if (!dragging || !containerRef.current || !naturalSize) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const imageRatio = naturalSize.w / naturalSize.h;

    const canDragX = imageRatio > targetRatio;
    const canDragY = imageRatio < targetRatio;

    const guideW = canDragX ? targetRatio / imageRatio : 1;
    const guideH = canDragY ? imageRatio / targetRatio : 1;
    const maxOffsetX = 1 - guideW;
    const maxOffsetY = 1 - guideH;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.startMouseX;
      const deltaY = clientY - dragStartRef.current.startMouseY;

      let newFocalX = dragStartRef.current.startFocalX;
      let newFocalY = dragStartRef.current.startFocalY;

      if (canDragX && maxOffsetX > 0) {
        const deltaPercent = (deltaX / containerRect.width / maxOffsetX) * 100;
        newFocalX = Math.max(
          0,
          Math.min(
            100,
            Math.round(dragStartRef.current.startFocalX + deltaPercent),
          ),
        );
      }

      if (canDragY && maxOffsetY > 0) {
        const deltaPercent = (deltaY / containerRect.height / maxOffsetY) * 100;
        newFocalY = Math.max(
          0,
          Math.min(
            100,
            Math.round(dragStartRef.current.startFocalY + deltaPercent),
          ),
        );
      }

      onChange(newFocalX, newFocalY);
    };

    const handleUp = () => {
      setDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [dragging, naturalSize, onChange, targetRatio]);

  const ratioLabel =
    targetRatio >= 1
      ? `${Math.round(targetRatio * 10) / 10}:1`
      : `1:${Math.round((1 / targetRatio) * 10) / 10}`;

  if (!imageUrl) {
    return (
      <div
        className="flex w-full max-w-xs items-center justify-center border border-dashed border-slate-300"
        style={{ aspectRatio: targetRatio }}
      >
        <p className="text-center text-xs text-slate-400">
          이미지를 선택하면{"\n"}표시 영역을 지정할 수 있습니다
        </p>
      </div>
    );
  }

  const guide = getGuideRect();

  return (
    <div className="space-y-4">
      {label && (
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          {label} 표시 영역 설정
        </p>
      )}

      <div
        ref={containerRef}
        className="relative aspect-square max-w-xs overflow-hidden select-none"
        style={{ touchAction: "none" }}
      >
        <Image
          src={imageUrl}
          alt="표시 영역 설정"
          fill
          className="object-contain"
          sizes="320px"
          unoptimized
          onLoad={handleImageLoad}
        />

        {guide && (guide.canDragX || guide.canDragY) && (
          <>
            <div
              className="pointer-events-none absolute top-0 right-0 left-0 bg-black/50"
              style={{ height: `${guide.y * 100}%` }}
            />
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 bg-black/50"
              style={{ height: `${(1 - guide.y - guide.h) * 100}%` }}
            />
            <div
              className="pointer-events-none absolute left-0 bg-black/50"
              style={{
                top: `${guide.y * 100}%`,
                height: `${guide.h * 100}%`,
                width: `${guide.x * 100}%`,
              }}
            />
            <div
              className="pointer-events-none absolute right-0 bg-black/50"
              style={{
                top: `${guide.y * 100}%`,
                height: `${guide.h * 100}%`,
                width: `${(1 - guide.x - guide.w) * 100}%`,
              }}
            />

            <div
              role="application"
              tabIndex={0}
              aria-label={`표시 영역 조정: ${guide.canDragX ? "좌우" : "상하"} 드래그로 위치 변경`}
              className="absolute border-2 border-white/80 shadow-lg"
              style={{
                left: `${guide.x * 100}%`,
                top: `${guide.y * 100}%`,
                width: `${guide.w * 100}%`,
                height: `${guide.h * 100}%`,
                cursor: dragging ? "grabbing" : "grab",
              }}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-bold text-white/70 drop-shadow-md">
                  {guide.canDragX ? "← 좌우 드래그 →" : "↑ 상하 드래그 ↓"}
                </p>
              </div>
            </div>
          </>
        )}

        {guide && !guide.canDragX && !guide.canDragY && naturalSize && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="bg-black/30 px-2 py-1 text-xs font-bold text-white/70 drop-shadow-md">
              {ratioLabel} 비율 일치
            </p>
          </div>
        )}
      </div>

      {guide && (guide.canDragX || guide.canDragY) && (
        <p className="text-xs text-slate-400">
          표시 위치: {focalX}% {focalY}%
        </p>
      )}

      <div>
        <p className="mb-2 text-xs text-slate-500">
          실제 표시 미리보기 ({ratioLabel})
        </p>
        <div
          className="relative w-32 overflow-hidden border border-slate-200 bg-slate-100"
          style={{ aspectRatio: targetRatio }}
        >
          <Image
            src={imageUrl}
            alt="미리보기"
            fill
            sizes="128px"
            className="object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
