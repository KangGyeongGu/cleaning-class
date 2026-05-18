"use client";

import { useActionState, useRef, useState } from "react";
import {
  updateSiteConfig,
  updateHeroImage,
  updateMovingSiteConfig,
} from "@/shared/actions/site-config";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { formatPhoneNumber } from "@/shared/lib/format";
import { getHeroImageUrl } from "@/shared/lib/supabase/storage";
import { FocalPointPicker } from "@/app/admin/components/FocalPointPicker";
import type { SiteConfig } from "@/shared/types/database";

interface SiteConfigFormProps {
  config: SiteConfig;
}

const HERO_BANNER_RATIO = 2.5;

interface HeroSlotFormProps {
  slot: "1" | "2";
  label: string;
  imagePath: string | null;
  initialFocalX: number;
  initialFocalY: number;
}

function HeroSlotForm({
  slot,
  label,
  imagePath,
  initialFocalX,
  initialFocalY,
}: HeroSlotFormProps) {
  const [state, formAction, isPending] = useActionState(updateHeroImage, null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [focalX, setFocalX] = useState(initialFocalX);
  const [focalY, setFocalY] = useState(initialFocalY);
  const prevBlobRef = useRef<string | null>(null);

  const currentImageUrl =
    imagePath && imagePath.trim() ? getHeroImageUrl(imagePath) : null;

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
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-900">{label}</p>

      <FocalPointPicker
        key={displayImageUrl}
        imageUrl={displayImageUrl}
        focalX={focalX}
        focalY={focalY}
        onChange={(x, y) => {
          setFocalX(x);
          setFocalY(y);
        }}
        label={label}
        targetRatio={HERO_BANNER_RATIO}
      />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="slot" value={slot} />
        <input type="hidden" name="focal_x" value={focalX} />
        <input type="hidden" name="focal_y" value={focalY} />

        <div>
          <label
            htmlFor={`hero_image_${slot}`}
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            이미지 선택
          </label>
          <input
            id={`hero_image_${slot}`}
            name="hero_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm font-light text-slate-600 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-widest file:text-white file:uppercase hover:file:bg-slate-800"
          />
        </div>

        {state && "message" in state && state.message && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}
        {state && "error" in state && state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-slate-900 px-6 py-3 text-sm font-bold tracking-widest text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            저장
          </button>

          {currentImageUrl && (
            <button
              type="submit"
              name="delete_hero_image"
              value="true"
              disabled={isPending}
              className="inline-flex items-center gap-2 border border-slate-300 px-6 py-3 text-sm font-bold tracking-widest text-slate-600 transition-colors hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

interface HeroImageFormProps {
  config: SiteConfig;
}

function HeroImageForm({ config }: HeroImageFormProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">히어로 배경이미지</h2>
        <p className="mt-1 text-xs font-light text-slate-500">
          메인 페이지 히어로 배너의 배경이미지입니다. 최대 2장(좌/우),
          JPG/PNG/WebP, 최대 10MB.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <HeroSlotForm
          slot="1"
          label="좌측 이미지"
          imagePath={config.hero_image_path ?? null}
          initialFocalX={config.hero_image_focal_x ?? 50}
          initialFocalY={config.hero_image_focal_y ?? 50}
        />
        <HeroSlotForm
          slot="2"
          label="우측 이미지"
          imagePath={config.hero_image_path_2 ?? null}
          initialFocalX={config.hero_image_focal_x_2 ?? 50}
          initialFocalY={config.hero_image_focal_y_2 ?? 50}
        />
      </div>
    </section>
  );
}

interface MovingConfigFormProps {
  config: SiteConfig;
}

function MovingConfigForm({ config }: MovingConfigFormProps) {
  const [movingState, movingFormAction, movingIsPending] = useActionState(
    updateMovingSiteConfig,
    null,
  );

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">이사업체 정보</h2>
        <p className="mt-1 text-xs font-light text-slate-500">
          이사 서비스 견적문의 및 연락처 정보에 표시되는 이사업체 정보입니다.
        </p>
      </div>

      <form action={movingFormAction} className="space-y-8">
        <div>
          <label
            htmlFor="moving_representative"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            대표자명 (선택)
          </label>
          <input
            id="moving_representative"
            name="moving_representative"
            type="text"
            defaultValue={config.moving_representative ?? ""}
            className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
            placeholder="대표자명을 입력하세요"
          />
          {movingState &&
            "errors" in movingState &&
            movingState.errors?.moving_representative && (
              <p className="mt-1 text-xs text-red-500">
                {movingState.errors.moving_representative[0]}
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="moving_phone"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            전화번호 (선택)
          </label>
          <input
            id="moving_phone"
            name="moving_phone"
            type="tel"
            defaultValue={config.moving_phone ?? ""}
            onInput={(e) => {
              const input = e.currentTarget;
              input.value = formatPhoneNumber(input.value);
            }}
            className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
            placeholder="000-0000-0000"
          />
          {movingState &&
            "errors" in movingState &&
            movingState.errors?.moving_phone && (
              <p className="mt-1 text-xs text-red-500">
                {movingState.errors.moving_phone[0]}
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="moving_business_registration_number"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            사업자등록번호 (선택)
          </label>
          <input
            id="moving_business_registration_number"
            name="moving_business_registration_number"
            type="text"
            defaultValue={config.moving_business_registration_number ?? ""}
            onInput={(e) => {
              const input = e.currentTarget;
              const digits = input.value.replace(/\D/g, "").slice(0, 10);
              if (digits.length <= 3) {
                input.value = digits;
              } else if (digits.length <= 5) {
                input.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
              } else {
                input.value = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
              }
            }}
            className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
            placeholder="000-00-00000"
          />
          {movingState &&
            "errors" in movingState &&
            movingState.errors?.moving_business_registration_number && (
              <p className="mt-1 text-xs text-red-500">
                {movingState.errors.moving_business_registration_number[0]}
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="moving_address"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            주소 (선택)
          </label>
          <input
            id="moving_address"
            name="moving_address"
            type="text"
            defaultValue={config.moving_address ?? ""}
            className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
            placeholder="전북특별자치도 전주시 완산구 ..."
          />
          {movingState &&
            "errors" in movingState &&
            movingState.errors?.moving_address && (
              <p className="mt-1 text-xs text-red-500">
                {movingState.errors.moving_address[0]}
              </p>
            )}
        </div>

        {movingState && "message" in movingState && movingState.message && (
          <p className="text-sm text-green-600">{movingState.message}</p>
        )}

        {movingState && "error" in movingState && movingState.error && (
          <p className="text-sm text-red-500">{movingState.error}</p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={movingIsPending}
            className="bg-slate-900 px-8 py-4 text-sm font-bold tracking-widest text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {movingIsPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
              </span>
            ) : (
              "저장"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export function SiteConfigForm({ config }: SiteConfigFormProps) {
  const [state, formAction, isPending] = useActionState(updateSiteConfig, null);

  return (
    <div className="space-y-16">
      <HeroImageForm config={config} />

      <hr className="border-slate-100" />

      <section>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            청소업체 기본 정보
          </h2>
          <p className="mt-1 text-xs font-light text-slate-500">
            업체명, 대표자, 연락처 등 청소업체의 기본 정보입니다.
          </p>
        </div>
        <form action={formAction} className="space-y-8">
          <div>
            <label
              htmlFor="business_name"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              업체명
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              defaultValue={config.business_name}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="업체명을 입력하세요"
            />
            {state && "errors" in state && state.errors?.business_name && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.business_name[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="representative"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              대표자명 (선택)
            </label>
            <input
              id="representative"
              name="representative"
              type="text"
              defaultValue={config.representative ?? ""}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="대표자명을 입력하세요"
            />
            {state && "errors" in state && state.errors?.representative && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.representative[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="business_registration_number"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              사업자번호 (선택)
            </label>
            <input
              id="business_registration_number"
              name="business_registration_number"
              type="text"
              defaultValue={config.business_registration_number || ""}
              onInput={(e) => {
                const input = e.currentTarget;
                const digits = input.value.replace(/\D/g, "").slice(0, 10);
                if (digits.length <= 3) {
                  input.value = digits;
                } else if (digits.length <= 5) {
                  input.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                } else {
                  input.value = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
                }
              }}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="000-00-00000"
            />
            {state &&
              "errors" in state &&
              state.errors?.business_registration_number && (
                <p className="mt-1 text-xs text-red-500">
                  {state.errors.business_registration_number[0]}
                </p>
              )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              전화번호
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={config.phone}
              onInput={(e) => {
                const input = e.currentTarget;
                input.value = formatPhoneNumber(input.value);
              }}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="000-0000-0000 또는 0000-0000-0000"
            />
            {state && "errors" in state && state.errors?.phone && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.phone[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={config.email}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="contact@example.com"
            />
            {state && "errors" in state && state.errors?.email && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="blog_url"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              블로그 URL (선택)
            </label>
            <input
              id="blog_url"
              name="blog_url"
              type="url"
              defaultValue={config.blog_url || ""}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="https://blog.naver.com/..."
            />
            {state && "errors" in state && state.errors?.blog_url && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.blog_url[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="instagram_url"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              인스타그램 URL (선택)
            </label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              defaultValue={config.instagram_url || ""}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="https://instagram.com/..."
            />
            {state && "errors" in state && state.errors?.instagram_url && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.instagram_url[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="daangn_url"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              당근마켓 URL (선택)
            </label>
            <input
              id="daangn_url"
              name="daangn_url"
              type="url"
              defaultValue={config.daangn_url || ""}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="https://www.daangn.com/..."
            />
            {state && "errors" in state && state.errors?.daangn_url && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.daangn_url[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              소개글 (최대 500자, 선택)
            </label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={config.description || ""}
              className="w-full resize-none border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="업체 소개글을 입력하세요"
            ></textarea>
            {state && "errors" in state && state.errors?.description && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              주소 (선택)
            </label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={config.address || ""}
              className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
              placeholder="전북특별자치도 전주시 완산구 ..."
            />
            {state && "errors" in state && state.errors?.address && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.address[0]}
              </p>
            )}
          </div>

          {state && "message" in state && state.message && (
            <p className="text-sm text-green-600">{state.message}</p>
          )}

          {state && "error" in state && state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="bg-slate-900 px-8 py-4 text-sm font-bold tracking-widest text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
                </span>
              ) : (
                "저장"
              )}
            </button>
          </div>
        </form>
      </section>

      <hr className="border-slate-100" />

      <MovingConfigForm config={config} />
    </div>
  );
}
