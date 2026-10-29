"use client";
import { useState } from "react";
import { createReview, updateReview } from "@/shared/actions/review";
import { AdminEditor } from "@/app/admin/components/AdminEditor.client";
import {
  EditorSection,
  PublishField,
} from "@/app/admin/components/EditorSection";
import {
  OutlinedField,
  OutlinedTextarea,
  OutlinedSelect,
} from "@/components/ui/OutlinedField";
import { TagManager } from "@/app/admin/components/TagManager.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";
import { useSingleImagePreview } from "@/shared/lib/hooks/useSingleImagePreview";
import { SERVICE_TYPES } from "@/shared/lib/pure/constants";
import type { Review } from "@/shared/types/database";

export function ReviewForm({
  review,
  imageUrl,
}: {
  review?: Review;
  imageUrl?: string;
}) {
  const image = useSingleImagePreview();
  const [tags, setTags] = useState<string[]>(review?.tags ?? []);
  const serviceTags: readonly string[] = SERVICE_TYPES;
  const selectedService = tags.find((tag) => serviceTags.includes(tag)) ?? "";
  const otherTags = tags.filter((tag) => !serviceTags.includes(tag));
  return (
    <AdminEditor
      title={review ? "작업후기 수정" : "작업후기 등록"}
      returnHref="/admin/reviews"
      busy={image.isConverting}
      action={
        review ? updateReview.bind(null, String(review.id)) : createReview
      }
    >
      {(errors, markChanged) => (
        <>
          <input type="hidden" name="tags" value={JSON.stringify(tags)} />
          <EditorSection title="글 정보">
            <OutlinedField
              id="title"
              name="title"
              label="제목"
              required
              maxLength={100}
              defaultValue={review?.title ?? ""}
              error={errors?.title?.[0]}
            />
            <OutlinedTextarea
              id="summary"
              name="summary"
              label="게시글 소개"
              required
              maxLength={500}
              rows={4}
              defaultValue={review?.summary ?? ""}
              error={errors?.summary?.[0]}
            />
            <OutlinedField
              id="link_url"
              name="link_url"
              label="바로가기 링크"
              type="url"
              defaultValue={review?.link_url ?? ""}
              error={errors?.link_url?.[0]}
            />
          </EditorSection>
          <EditorSection title="분류">
            <OutlinedSelect
              id="service_type"
              label="서비스 종류"
              value={selectedService}
              required
              error={errors?.tags?.[0]}
              onChange={(event) => {
                setTags([...otherTags, event.target.value]);
                markChanged();
              }}
            >
              <option value="" disabled>
                선택
              </option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </OutlinedSelect>
            <TagManager
              label="추가 태그"
              tags={otherTags}
              onAdd={(tag) => {
                if (!tags.includes(tag) && !serviceTags.includes(tag)) {
                  setTags([...tags, tag]);
                  markChanged();
                }
              }}
              onRemove={(index) => {
                setTags(tags.filter((tag) => tag !== otherTags[index]));
                markChanged();
              }}
            />
          </EditorSection>
          <EditorSection title="사진">
            <ImageUploadField
              id="image"
              name="image"
              label="대표 이미지"
              required={!review}
              previewUrl={image.previewUrl ?? imageUrl}
              onChange={image.handleChange}
              previewSize="lg"
            />
          </EditorSection>
          <EditorSection title="게시 설정">
            <PublishField defaultChecked={review?.is_published ?? true} />
          </EditorSection>
        </>
      )}
    </AdminEditor>
  );
}
