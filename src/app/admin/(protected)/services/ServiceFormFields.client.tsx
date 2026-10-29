"use client";

import { useEffect, useState } from "react";
import { TagManager } from "@/app/admin/components/TagManager.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";
import { ServiceImageFocalField } from "@/app/admin/(protected)/services/ServiceImageFocalField.client";
import { useSingleImagePreview } from "@/shared/lib/hooks/useSingleImagePreview";
import {
  OutlinedField,
  OutlinedSelect,
  OutlinedTextarea,
} from "@/components/ui/OutlinedField";
import {
  EditorSection,
  PublishField,
} from "@/app/admin/components/EditorSection";
import type { Service } from "@/shared/types/database";

interface ServiceFormFieldsProps {
  service?: Service;
  defaultSortOrder?: number;
  imageUrl?: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
  errors?: Partial<Record<string, string[] | undefined>>;
  onChanged: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function ServiceFormFields({
  service,
  defaultSortOrder = 0,
  imageUrl,
  afterImageUrl,
  detailImageUrl,
  detailAfterImageUrl,
  errors,
  onChanged,
  onBusyChange,
}: ServiceFormFieldsProps): React.ReactElement {
  const editing = service !== undefined;
  const replaceLabel = editing ? "이미지 변경" : undefined;
  const selectLabel = editing ? "새 이미지 선택" : undefined;

  const beforeImage = useSingleImagePreview();
  const afterImage = useSingleImagePreview();
  const detailImage = useSingleImagePreview();
  const detailAfterImage = useSingleImagePreview();
  const converting =
    beforeImage.isConverting ||
    afterImage.isConverting ||
    detailImage.isConverting ||
    detailAfterImage.isConverting;
  useEffect(() => {
    onBusyChange(converting);
  }, [converting, onBusyChange]);
  const [tags, setTags] = useState<string[]>(service?.tags ?? []);
  const [focalX, setFocalX] = useState(service?.image_focal_x ?? 50);
  const [focalY, setFocalY] = useState(service?.image_focal_y ?? 50);
  const [afterFocalX, setAfterFocalX] = useState(
    service?.image_after_focal_x ?? 50,
  );
  const [afterFocalY, setAfterFocalY] = useState(
    service?.image_after_focal_y ?? 50,
  );

  const handleAddTag = (tag: string) => {
    if (tag.length <= 30 && !tags.includes(tag)) {
      setTags([...tags, tag]);
      onChanged();
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
    onChanged();
  };

  return (
    <>
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />

      <EditorSection title="기본 정보">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <OutlinedField
            id="title"
            name="title"
            label="서비스명"
            required
            maxLength={50}
            defaultValue={service?.title ?? ""}
            error={errors?.title?.[0]}
          />
          <OutlinedSelect
            id="category"
            name="category"
            label="서비스 종류"
            defaultValue={service?.category ?? "cleaning"}
            error={errors?.category?.[0]}
          >
            <option value="cleaning">청소</option>
            <option value="moving">이사</option>
          </OutlinedSelect>
        </div>
        <OutlinedTextarea
          id="description"
          name="description"
          label="서비스 설명"
          maxLength={500}
          rows={4}
          defaultValue={service?.description ?? ""}
          error={errors?.description?.[0]}
        />
        <TagManager
          label="태그"
          tags={tags}
          onAdd={handleAddTag}
          onRemove={handleRemoveTag}
          error={errors?.tags?.[0]}
        />
      </EditorSection>
      <EditorSection title="대표 이미지">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ServiceImageFocalField
            id="image"
            inputName="image"
            required={!editing}
            label="Before 이미지 (작업 전)"
            previewUrl={beforeImage.previewUrl || imageUrl}
            onChange={beforeImage.handleChange}
            focalX={focalX}
            focalY={focalY}
            onFocalChange={(x, y) => {
              setFocalX(x);
              setFocalY(y);
              onChanged();
            }}
            focalXName="image_focal_x"
            focalYName="image_focal_y"
            pickerLabel="Before"
            replaceLabel={replaceLabel}
            selectLabel={selectLabel}
          />
          <ServiceImageFocalField
            id="image_after"
            inputName="image_after"
            label="After 이미지 (작업 후, 선택)"
            previewUrl={afterImage.previewUrl || afterImageUrl}
            onChange={afterImage.handleChange}
            focalX={afterFocalX}
            focalY={afterFocalY}
            onFocalChange={(x, y) => {
              setAfterFocalX(x);
              setAfterFocalY(y);
              onChanged();
            }}
            focalXName="image_after_focal_x"
            focalYName="image_after_focal_y"
            pickerLabel="After"
            replaceLabel={replaceLabel}
            selectLabel={selectLabel}
          />
        </div>
      </EditorSection>
      <EditorSection title="상세 이미지">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageUploadField
            id="detail_image"
            name="detail_image"
            label="Before 이미지"
            previewUrl={detailImage.previewUrl ?? detailImageUrl ?? null}
            onChange={detailImage.handleChange}
            replaceLabel={replaceLabel}
            selectLabel={selectLabel}
            previewSize="lg"
          />
          <ImageUploadField
            id="detail_image_after"
            name="detail_image_after"
            label="After 이미지"
            previewUrl={
              detailAfterImage.previewUrl ?? detailAfterImageUrl ?? null
            }
            onChange={detailAfterImage.handleChange}
            replaceLabel={replaceLabel}
            selectLabel={selectLabel}
            previewSize="lg"
          />
        </div>
      </EditorSection>

      <EditorSection title="게시 설정">
        <div className="grid items-center gap-5 sm:grid-cols-2">
          <OutlinedField
            id="sort_order"
            name="sort_order"
            label="표시 순서"
            type="number"
            min={0}
            defaultValue={service?.sort_order ?? defaultSortOrder}
            error={errors?.sort_order?.[0]}
          />
          <PublishField defaultChecked={service?.is_published ?? true} />
        </div>
      </EditorSection>
    </>
  );
}
