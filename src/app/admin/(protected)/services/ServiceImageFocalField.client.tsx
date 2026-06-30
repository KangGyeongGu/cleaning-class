"use client";

import { FocalPointPicker } from "@/app/admin/components/FocalPointPicker.client";
import { ImageUploadField } from "@/app/admin/components/ImageUploadField.client";

interface ServiceImageFocalFieldProps {
  id: string;
  inputName: string;
  label: string;
  required?: boolean;
  selectLabel?: string;
  replaceLabel?: string;
  pickerLabel: string;
  previewUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  focalX: number;
  focalY: number;
  onFocalChange: (x: number, y: number) => void;
  focalXName: string;
  focalYName: string;
}

export function ServiceImageFocalField({
  id,
  inputName,
  label,
  required,
  selectLabel,
  replaceLabel,
  pickerLabel,
  previewUrl,
  onChange,
  focalX,
  focalY,
  onFocalChange,
  focalXName,
  focalYName,
}: ServiceImageFocalFieldProps): React.ReactElement {
  return (
    <ImageUploadField
      id={id}
      name={inputName}
      label={label}
      required={required}
      previewUrl={null}
      onChange={onChange}
      selectLabel={selectLabel}
      replaceLabel={replaceLabel}
    >
      <FocalPointPicker
        key={previewUrl ?? ""}
        imageUrl={previewUrl ?? null}
        focalX={focalX}
        focalY={focalY}
        onChange={onFocalChange}
        label={pickerLabel}
      />
      <input type="hidden" name={focalXName} value={focalX} />
      <input type="hidden" name={focalYName} value={focalY} />
    </ImageUploadField>
  );
}
