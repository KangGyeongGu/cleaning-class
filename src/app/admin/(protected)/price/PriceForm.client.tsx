"use client";
import { useState } from "react";
import { createPriceItem, updatePriceItem } from "@/shared/actions/price";
import { AdminEditor } from "@/app/admin/components/AdminEditor.client";
import {
  EditorSection,
  PublishField,
} from "@/app/admin/components/EditorSection";
import { OutlinedField } from "@/components/ui/OutlinedField";
import type { PriceItemRow } from "@/shared/types/database";
export function PriceForm({
  priceItem,
  defaultSortOrder = 0,
}: {
  priceItem?: PriceItemRow;
  defaultSortOrder?: number;
}) {
  const [variable, setVariable] = useState(
    priceItem ? priceItem.price_won === null : false,
  );
  return (
    <AdminEditor
      title={priceItem ? "가격 수정" : "가격 등록"}
      returnHref="/admin/price"
      action={
        priceItem ? updatePriceItem.bind(null, priceItem.id) : createPriceItem
      }
    >
      {(errors) => (
        <>
          <EditorSection title="가격 정보">
            <OutlinedField
              id="name"
              name="name"
              label="항목명"
              required
              maxLength={100}
              defaultValue={priceItem?.name ?? ""}
              error={errors?.name?.[0]}
            />
            <div className="grid items-center gap-5 sm:grid-cols-2">
              <OutlinedField
                id="price_won"
                name="price_won"
                label="최소 가격 (원)"
                type="number"
                min={0}
                max={99999999}
                step={1000}
                required={!variable}
                disabled={variable}
                defaultValue={priceItem?.price_won ?? ""}
                error={errors?.price_won?.[0]}
              />
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  name="is_variable"
                  type="checkbox"
                  value="true"
                  checked={variable}
                  onChange={(event) => setVariable(event.target.checked)}
                  className="h-4 w-4 accent-slate-900"
                />
                현장 견적
              </label>
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
                max={9999}
                defaultValue={priceItem?.sort_order ?? defaultSortOrder}
                error={errors?.sort_order?.[0]}
              />
              <PublishField defaultChecked={priceItem?.is_published ?? true} />
            </div>
          </EditorSection>
        </>
      )}
    </AdminEditor>
  );
}
