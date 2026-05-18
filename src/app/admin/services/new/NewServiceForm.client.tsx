"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createService } from "@/shared/actions/service";
import { Loader2, Plus, X } from "lucide-react";
import { FocalPointPicker } from "@/app/admin/components/FocalPointPicker";

interface NewServiceFormProps {
  defaultSortOrder?: number;
}

export function NewServiceForm({ defaultSortOrder = 0 }: NewServiceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createService, null);
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [afterFocalX, setAfterFocalX] = useState(50);
  const [afterFocalY, setAfterFocalY] = useState(50);

  const imagePreviewRef = useRef<string | null>(null);
  const afterImagePreviewRef = useRef<string | null>(null);
  const detailImagePreviewRef = useRef<string | null>(null);
  const detailAfterImagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

  useEffect(() => {
    afterImagePreviewRef.current = afterImagePreview;
  }, [afterImagePreview]);

  useEffect(() => {
    detailImagePreviewRef.current = detailImagePreview;
  }, [detailImagePreview]);

  useEffect(() => {
    detailAfterImagePreviewRef.current = detailAfterImagePreview;
  }, [detailAfterImagePreview]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      if (afterImagePreviewRef.current)
        URL.revokeObjectURL(afterImagePreviewRef.current);
      if (detailImagePreviewRef.current)
        URL.revokeObjectURL(detailImagePreviewRef.current);
      if (detailAfterImagePreviewRef.current)
        URL.revokeObjectURL(detailAfterImagePreviewRef.current);
    };
  }, []);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push("/admin/services");
    }
  }, [state, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
      const url = URL.createObjectURL(file);
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
      setAfterImagePreview(url);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && trimmed.length <= 30 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("tags", JSON.stringify(tags));
    await formAction(formData);
  };

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
          defaultValue="cleaning"
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
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-base leading-relaxed font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="서비스 소개 페이지에 표시될 설명을 입력하세요"
        />
        {state && "errors" in state && state.errors?.description && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="tagInput"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          서비스 태그
        </label>
        <div className="mb-3 flex gap-2">
          <input
            id="tagInput"
            type="text"
            value={tagInput}
            maxLength={30}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                if (!e.nativeEvent.isComposing) {
                  handleAddTag();
                }
              }
            }}
            className="flex-1 border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
            placeholder="태그 입력 후 추가 버튼 클릭 또는 Enter (최대 30자)"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="border border-slate-900 px-4 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        {state && "errors" in state && state.errors?.tags && (
          <p className="mt-1 text-xs text-red-500">{state.errors.tags[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <label
            htmlFor="image"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            Before 이미지 (작업 전)
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <label
            htmlFor="image"
            className="mb-4 inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
          >
            <Plus size={16} />
            이미지 선택
          </label>
          <FocalPointPicker
            key={imagePreview}
            imageUrl={imagePreview}
            focalX={focalX}
            focalY={focalY}
            onChange={(x, y) => {
              setFocalX(x);
              setFocalY(y);
            }}
            label="Before"
          />
          <input type="hidden" name="image_focal_x" value={focalX} />
          <input type="hidden" name="image_focal_y" value={focalY} />
        </div>

        <div>
          <label
            htmlFor="image_after"
            className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
          >
            After 이미지 (작업 후, 선택)
          </label>
          <input
            id="image_after"
            name="image_after"
            type="file"
            accept="image/*"
            onChange={handleAfterImageChange}
            className="hidden"
          />
          <label
            htmlFor="image_after"
            className="mb-4 inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
          >
            <Plus size={16} />
            이미지 선택
          </label>
          <FocalPointPicker
            key={afterImagePreview}
            imageUrl={afterImagePreview}
            focalX={afterFocalX}
            focalY={afterFocalY}
            onChange={(x, y) => {
              setAfterFocalX(x);
              setAfterFocalY(y);
            }}
            label="After"
          />
          <input type="hidden" name="image_after_focal_x" value={afterFocalX} />
          <input type="hidden" name="image_after_focal_y" value={afterFocalY} />
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-bold tracking-widest text-slate-900 uppercase">
          서비스 소개 페이지용 이미지 (선택)
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <label
              htmlFor="detail_image"
              className="mb-3 block text-xs font-bold text-slate-500"
            >
              Before 이미지
            </label>
            <input
              id="detail_image"
              name="detail_image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setDetailImagePreview(URL.createObjectURL(file));
              }}
              className="hidden"
            />
            <label
              htmlFor="detail_image"
              className="inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
            >
              <Plus size={16} />
              이미지 선택
            </label>
            {detailImagePreview && (
              <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden border border-slate-200">
                <Image
                  src={detailImagePreview}
                  alt="상세 Before 미리보기"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="detail_image_after"
              className="mb-3 block text-xs font-bold text-slate-500"
            >
              After 이미지
            </label>
            <input
              id="detail_image_after"
              name="detail_image_after"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setDetailAfterImagePreview(URL.createObjectURL(file));
              }}
              className="hidden"
            />
            <label
              htmlFor="detail_image_after"
              className="inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
            >
              <Plus size={16} />
              이미지 선택
            </label>
            {detailAfterImagePreview && (
              <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden border border-slate-200">
                <Image
                  src={detailAfterImagePreview}
                  alt="상세 After 미리보기"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
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
          defaultValue={defaultSortOrder}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none focus:border-slate-900"
        />
        {state && "errors" in state && state.errors?.sort_order && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.sort_order[0]}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            value="true"
            defaultChecked
            className="h-5 w-5"
          />
          <label
            htmlFor="is_published"
            className="text-sm font-bold text-slate-900"
          >
            즉시 게시
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          체크 해제 시 저장만 되고 홈페이지에 노출되지 않습니다.
        </p>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={
            isPending || !!(state && "success" in state && state.success)
          }
          className="bg-slate-900 px-8 py-4 text-sm font-bold tracking-widest text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> 등록 중...
            </span>
          ) : (
            "등록"
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
