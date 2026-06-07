"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateService } from "@/shared/actions/service";
import { Loader2 } from "lucide-react";
import { TagManager } from "@/app/admin/components/TagManager.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";
import { ServiceImageFocalField } from "@/app/admin/services/ServiceImageFocalField.client";
import type { Service } from "@/shared/types/database";

interface EditServiceFormProps {
  service: Service;
  imageUrl: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
}

export function EditServiceForm({
  service,
  imageUrl,
  afterImageUrl,
  detailImageUrl,
  detailAfterImageUrl,
}: EditServiceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateService.bind(null, String(service.id)),
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(
    null,
  );
  const [detailImagePreview, setDetailImagePreview] = useState<string | null>(
    null,
  );
  const [detailAfterImagePreview, setDetailAfterImagePreview] = useState<
    string | null
  >(null);
  const [tags, setTags] = useState<string[]>(service.tags ?? []);
  const [focalX, setFocalX] = useState(service.image_focal_x);
  const [focalY, setFocalY] = useState(service.image_focal_y);
  const [afterFocalX, setAfterFocalX] = useState(service.image_after_focal_x);
  const [afterFocalY, setAfterFocalY] = useState(service.image_after_focal_y);

  const imagePreviewRef = useRef<string | null>(null);
  const afterImagePreviewRef = useRef<string | null>(null);
  const detailImagePreviewRef = useRef<string | null>(null);
  const detailAfterImagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    const refs = [
      imagePreviewRef,
      afterImagePreviewRef,
      detailImagePreviewRef,
      detailAfterImagePreviewRef,
    ];
    return () => {
      for (const r of refs) if (r.current) URL.revokeObjectURL(r.current);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
      const url = URL.createObjectURL(file);
      imagePreviewRef.current = url;
      setImagePreview(url);
    }
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (afterImagePreviewRef.current) {
        URL.revokeObjectURL(afterImagePreviewRef.current);
      }
      const url = URL.createObjectURL(file);
      afterImagePreviewRef.current = url;
      setAfterImagePreview(url);
    }
  };

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push("/admin/services");
    }
  }, [state, router]);

  const handleAddTag = (tag: string) => {
    if (tag.length <= 30 && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("tags", JSON.stringify(tags));
    await formAction(formData);
  };

  const displayImageUrl = imagePreview || imageUrl;
  const displayAfterImageUrl = afterImagePreview || afterImageUrl;

  return (
    <form action={handleSubmit} className="space-y-8">
      <div>
        <label
          htmlFor="title"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          서비스명 (최대 50자)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={50}
          defaultValue={service.title}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="서비스명을 입력하세요"
        />
        {state && "errors" in state && state.errors?.title && (
          <p className="mt-1 text-xs text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          카테고리
        </label>
        <select
          id="category"
          name="category"
          defaultValue={service.category}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none focus:border-slate-900"
        >
          <option value="cleaning">청소 서비스</option>
          <option value="moving">이사 서비스</option>
        </select>
        {state && "errors" in state && state.errors?.category && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.category[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          서비스 설명 (최대 500자, 선택)
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={service.description}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-base leading-relaxed font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="서비스 소개 페이지에 표시될 설명을 입력하세요"
        />
        {state && "errors" in state && state.errors?.description && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <TagManager
        label="서비스 태그"
        tags={tags}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
        error={state && "errors" in state ? state.errors?.tags?.[0] : undefined}
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ServiceImageFocalField
          id="image"
          inputName="image"
          label="Before 이미지 (작업 전)"
          previewUrl={displayImageUrl}
          onChange={handleImageChange}
          focalX={focalX}
          focalY={focalY}
          onFocalChange={(x, y) => {
            setFocalX(x);
            setFocalY(y);
          }}
          focalXName="image_focal_x"
          focalYName="image_focal_y"
          pickerLabel="Before"
          replaceLabel="이미지 변경"
          selectLabel="새 이미지 선택"
        />
        <ServiceImageFocalField
          id="image_after"
          inputName="image_after"
          label="After 이미지 (작업 후, 선택)"
          previewUrl={displayAfterImageUrl ?? null}
          onChange={handleAfterImageChange}
          focalX={afterFocalX}
          focalY={afterFocalY}
          onFocalChange={(x, y) => {
            setAfterFocalX(x);
            setAfterFocalY(y);
          }}
          focalXName="image_after_focal_x"
          focalYName="image_after_focal_y"
          pickerLabel="After"
          replaceLabel="이미지 변경"
          selectLabel="새 이미지 선택"
        />
      </div>

      <div>
        <p className="mb-4 text-xs font-bold tracking-widest text-slate-900 uppercase">
          서비스 소개 페이지용 이미지 (선택)
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ImageUploadField
            id="detail_image"
            name="detail_image"
            label="Before 이미지"
            previewUrl={detailImagePreview ?? detailImageUrl ?? null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setDetailImagePreview(URL.createObjectURL(file));
            }}
            replaceLabel="이미지 변경"
            selectLabel="새 이미지 선택"
            previewSize="lg"
          />
          <ImageUploadField
            id="detail_image_after"
            name="detail_image_after"
            label="After 이미지"
            previewUrl={detailAfterImagePreview ?? detailAfterImageUrl ?? null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setDetailAfterImagePreview(URL.createObjectURL(file));
            }}
            replaceLabel="이미지 변경"
            selectLabel="새 이미지 선택"
            previewSize="lg"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="sort_order"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          정렬 순서
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min="0"
          defaultValue={service.sort_order}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none focus:border-slate-900"
        />
        {state && "errors" in state && state.errors?.sort_order && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.sort_order[0]}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          value="true"
          defaultChecked={service.is_published}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_published"
          className="text-sm font-bold text-slate-900"
        >
          게시
        </label>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-900 px-8 py-4 text-sm font-bold tracking-widest text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> 수정 중...
            </span>
          ) : (
            "수정"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-slate-900 px-8 py-4 text-sm font-bold tracking-widest text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
        >
          취소
        </button>
      </div>
    </form>
  );
}
