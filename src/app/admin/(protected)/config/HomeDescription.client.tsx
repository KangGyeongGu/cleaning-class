"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { updateHomeDescription } from "@/app/admin/(protected)/config/actions";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";

export function HomeDescription({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-sm font-bold text-slate-900">
        소개 문구
      </h2>
      <InlineDescriptionEditor
        initialValue={initialValue}
        label="소개 문구"
        labelHidden
        placeholder="소개 문구"
        emptyText="등록된 소개 문구가 없습니다."
        maxLength={500}
        onSave={async (value) => {
          const result = await updateHomeDescription(value);
          if (result.success) router.refresh();
          return result;
        }}
      />
    </section>
  );
}
