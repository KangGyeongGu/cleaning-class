"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateReview } from "@/shared/actions/review";
import { Loader2, X, Plus } from "lucide-react";
import Image from "next/image";
import type { Review } from "@/shared/types/database";
import { SERVICE_TYPES } from "@/shared/lib/constants";

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
  const [tagInput, setTagInput] = useState("");
  const existingService = (review.tags ?? []).find((t) =>
    (SERVICE_TYPES as readonly string[]).includes(t),
  );
  const [selectedService, setSelectedService] = useState<string>(
    existingService || "",
  );

  const imagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

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
      setImagePreview(url);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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

      <div>
        <label
          htmlFor="tagInput"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          태그
        </label>
        <div className="mb-3 flex gap-2">
          <input
            id="tagInput"
            type="text"
            value={tagInput}
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
            placeholder="태그 입력 후 추가 버튼 클릭 또는 Enter"
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
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
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

      <div>
        <label
          htmlFor="image"
          className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
        >
          이미지
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
          className="inline-flex cursor-pointer items-center gap-2 border border-slate-200 px-6 py-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <Plus size={16} />
          {imagePreview ? "이미지 변경" : "새 이미지 선택"}
        </label>
        <div className="relative mt-4 h-64 w-full max-w-md border border-slate-200">
          <Image
            src={displayImageUrl}
            alt="미리보기"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 448px"
            unoptimized={!!imagePreview}
          />
        </div>
      </div>

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
