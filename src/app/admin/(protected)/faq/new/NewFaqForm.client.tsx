"use client";

import { useRouter } from "next/navigation";
import { createFaq } from "@/shared/actions/faq";
import { useAdminForm } from "@/shared/lib/hooks/useAdminForm";
import { Button } from "@/components/ui/Button";

interface NewFaqFormProps {
  defaultDisplayOrder?: number;
}

export function NewFaqForm({ defaultDisplayOrder = 0 }: NewFaqFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useAdminForm(createFaq, "/admin/faq");

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <label htmlFor="question" className="form-label">
          질문 (최대 300자)
        </label>
        <textarea
          id="question"
          name="question"
          required
          maxLength={300}
          rows={3}
          disabled={isPending}
          className="form-input-lg resize-none disabled:opacity-50"
          placeholder="자주 묻는 질문을 입력하세요"
        ></textarea>
        {state && "errors" in state && state.errors?.question && (
          <p className="form-error">{state.errors.question[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="answer" className="form-label">
          답변 (최대 2000자)
        </label>
        <textarea
          id="answer"
          name="answer"
          required
          maxLength={2000}
          rows={8}
          disabled={isPending}
          className="form-input-lg resize-none disabled:opacity-50"
          placeholder="답변을 입력하세요"
        ></textarea>
        {state && "errors" in state && state.errors?.answer && (
          <p className="form-error">{state.errors.answer[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="display_order" className="form-label">
          표시 순서
        </label>
        <input
          id="display_order"
          name="display_order"
          type="number"
          min="0"
          defaultValue={defaultDisplayOrder}
          disabled={isPending}
          className="form-input-lg disabled:opacity-50"
        />
        {state && "errors" in state && state.errors?.display_order && (
          <p className="form-error">{state.errors.display_order[0]}</p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            value="true"
            defaultChecked
            disabled={isPending}
            className="h-5 w-5 disabled:opacity-50"
          />
          <label
            htmlFor="is_active"
            className="text-sm font-bold text-slate-900"
          >
            즉시 활성화
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          체크 해제 시 저장만 되고 홈페이지에 노출되지 않습니다.
        </p>
      </div>

      {state && "error" in state && state.error && (
        <p className="form-error text-sm">{state.error}</p>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          loading={isPending}
          disabled={
            isPending || !!(state && "success" in state && state.success)
          }
        >
          {isPending ? "등록 중..." : "등록"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}
