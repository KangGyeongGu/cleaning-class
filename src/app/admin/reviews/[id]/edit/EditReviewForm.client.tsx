"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateReview } from "@/shared/actions/review";
import { Loader2 } from "lucide-react";
import type { Review } from "@/shared/types/database";
import { SERVICE_TYPES } from "@/shared/lib/pure/constants";
import { TagManager } from "@/app/admin/components/TagManager.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";

interface EditReviewFormProps {
  review: Review;
  imageUrl: string;
}

export function EditReviewForm({ review, imageUrl }: EditReviewFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateReview.bind(null, String(review.id)),
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(review.tags ?? []);
  const existingService = (review.tags ?? []).find((t) =>
    (SERVICE_TYPES as readonly string[]).includes(t),
  );
  const [selectedService, setSelectedService] = useState<string>(
    existingService || "",
  );

  const imagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
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

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
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

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push("/admin/reviews");
    }
  }, [state, router]);

  const displayImageUrl = imagePreview || imageUrl;

  return (
    <form action={handleSubmit} className="space-y-8">
      <div>
        <label
          htmlFor="title"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          제목 (최대 100자)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={review.title}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="리뷰 제목을 입력하세요"
        />
        {state && "errors" in state && state.errors?.title && (
          <p className="mt-1 text-xs text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="summary"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          소개글 (최대 500자)
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          maxLength={500}
          rows={3}
          defaultValue={review.summary}
          className="w-full resize-none border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="리뷰 소개글을 입력하세요"
        ></textarea>
        {state && "errors" in state && state.errors?.summary && (
          <p className="mt-1 text-xs text-red-500">{state.errors.summary[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="link_url"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          바로가기 링크 (선택)
        </label>
        <input
          id="link_url"
          name="link_url"
          type="url"
          defaultValue={review.link_url || ""}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-lg font-light transition-colors outline-none placeholder:text-slate-300 focus:border-slate-900"
          placeholder="https://blog.naver.com/..."
        />
        {state && "errors" in state && state.errors?.link_url && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.link_url[0]}
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase">
          서비스 종류 <span className="text-red-500">*</span>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          서비스 종류를 반드시 하나 선택해주세요. 선택한 항목은 태그로 자동
          추가됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const filtered = tags.filter(
                  (t) => !(SERVICE_TYPES as readonly string[]).includes(t),
                );
                setTags([...filtered, type]);
                setSelectedService(type);
              }}
              className={`border px-4 py-2 text-sm transition-colors ${
                selectedService === type
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <TagManager
        label="태그"
        tags={tags}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
        error={state && "errors" in state ? state.errors?.tags?.[0] : undefined}
      />

      <ImageUploadField
        id="image"
        name="image"
        label="이미지"
        previewUrl={displayImageUrl}
        onChange={handleImageChange}
        replaceLabel="이미지 변경"
        selectLabel="새 이미지 선택"
        previewSize="md"
      />

      <div className="flex items-center gap-3">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          value="true"
          defaultChecked={review.is_published}
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
