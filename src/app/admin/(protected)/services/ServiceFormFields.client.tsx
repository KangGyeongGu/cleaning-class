"use client";

import { useState } from "react";
import { TagManager } from "@/app/admin/components/TagManager.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";
import { ServiceImageFocalField } from "@/app/admin/(protected)/services/ServiceImageFocalField.client";
import { useSingleImagePreview } from "@/shared/lib/hooks/useSingleImagePreview";
import type { Service } from "@/shared/types/database";

interface ServiceFormFieldsProps {
  service?: Service;
  defaultSortOrder?: number;
  imageUrl?: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
  errors?: Partial<Record<string, string[]>>;
}

export function ServiceFormFields({
  service,
  defaultSortOrder = 0,
  imageUrl,
  afterImageUrl,
  detailImageUrl,
  detailAfterImageUrl,
  errors,
}: ServiceFormFieldsProps): React.ReactElement {
  const editing = service !== undefined;
  const replaceLabel = editing ? "이미지 변경" : undefined;
  const selectLabel = editing ? "새 이미지 선택" : undefined;

  const beforeImage = useSingleImagePreview();
  const afterImage = useSingleImagePreview();
  const detailImage = useSingleImagePreview();
  const detailAfterImage = useSingleImagePreview();
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
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <>
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />

      <div>
        <label htmlFor="title" className="form-label">
          서비스명 (최대 50자)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={50}
          defaultValue={service?.title}
          className="form-input-lg"
          placeholder="서비스명을 입력하세요"
        />
        {errors?.title && <p className="form-error">{errors.title[0]}</p>}
      </div>

      <div>
        <label htmlFor="category" className="form-label">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          defaultValue={service?.category ?? "cleaning"}
          className="form-input-lg"
        >
          <option value="cleaning">청소 서비스</option>
          <option value="moving">이사 서비스</option>
        </select>
        {errors?.category && <p className="form-error">{errors.category[0]}</p>}
      </div>

      <div>
        <label htmlFor="description" className="form-label">
          서비스 설명 (최대 500자, 선택)
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={service?.description}
          className="w-full border-b border-slate-200 bg-transparent pb-3 text-base leading-relaxed font-light transition-colors outline-none placeholder:text-slate-400 focus:border-slate-900"
          placeholder="서비스 소개 페이지에 표시될 설명을 입력하세요"
        />
        {errors?.description && (
          <p className="form-error">{errors.description[0]}</p>
        )}
      </div>

      <TagManager
        label="서비스 태그"
        tags={tags}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
        error={errors?.tags?.[0]}
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ServiceImageFocalField
          id="image"
          inputName="image"
          label="Before 이미지 (작업 전)"
          previewUrl={beforeImage.previewUrl || imageUrl}
          onChange={beforeImage.handleChange}
          focalX={focalX}
          focalY={focalY}
          onFocalChange={(x, y) => {
            setFocalX(x);
            setFocalY(y);
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
          }}
          focalXName="image_after_focal_x"
          focalYName="image_after_focal_y"
          pickerLabel="After"
          replaceLabel={replaceLabel}
          selectLabel={selectLabel}
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
      </div>

      <div>
        <label htmlFor="sort_order" className="form-label">
          정렬 순서
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min="0"
          defaultValue={service?.sort_order ?? defaultSortOrder}
          className="form-input-lg"
        />
        {errors?.sort_order && (
          <p className="form-error">{errors.sort_order[0]}</p>
        )}
      </div>

      {service ? (
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
      ) : (
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
      )}
    </>
  );
}
