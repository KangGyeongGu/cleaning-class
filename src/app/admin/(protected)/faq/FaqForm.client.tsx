"use client";
import { createFaq, updateFaq } from "@/shared/actions/faq";
import { AdminEditor } from "@/app/admin/components/AdminEditor.client";
import {
  EditorSection,
  PublishField,
} from "@/app/admin/components/EditorSection";
import { OutlinedField, OutlinedTextarea } from "@/components/ui/OutlinedField";
import type { FaqRow } from "@/shared/types/database";
export function FaqForm({
  faq,
  defaultDisplayOrder = 0,
}: {
  faq?: FaqRow;
  defaultDisplayOrder?: number;
}) {
  return (
    <AdminEditor
      title={faq ? "질문 수정" : "질문 등록"}
      returnHref="/admin/faq"
      action={faq ? updateFaq.bind(null, String(faq.id)) : createFaq}
    >
      {(errors) => (
        <>
          <EditorSection title="질문과 답변">
            <OutlinedTextarea
              id="question"
              name="question"
              label="질문"
              required
              maxLength={300}
              rows={2}
              defaultValue={faq?.question ?? ""}
              error={errors?.question?.[0]}
            />
            <OutlinedTextarea
              id="answer"
              name="answer"
              label="답변"
              required
              maxLength={2000}
              rows={8}
              defaultValue={faq?.answer ?? ""}
              error={errors?.answer?.[0]}
            />
          </EditorSection>
          <EditorSection title="게시 설정">
            <div className="grid items-center gap-5 sm:grid-cols-2">
              <OutlinedField
                id="display_order"
                name="display_order"
                label="표시 순서"
                type="number"
                min={0}
                defaultValue={faq?.display_order ?? defaultDisplayOrder}
                error={errors?.display_order?.[0]}
              />
              <PublishField
                name="is_active"
                defaultChecked={faq?.is_active ?? true}
              />
            </div>
          </EditorSection>
        </>
      )}
    </AdminEditor>
  );
}
