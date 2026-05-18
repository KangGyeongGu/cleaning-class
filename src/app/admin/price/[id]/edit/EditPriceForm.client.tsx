"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePriceItem } from "@/shared/actions/price";
import { Loader2 } from "lucide-react";
import type { PriceItemRow } from "@/shared/types/database";

interface EditPriceFormProps {
  priceItem: PriceItemRow;
}

export function EditPriceForm({ priceItem }: EditPriceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updatePriceItem.bind(null, priceItem.id),
    null,
  );
  const [isVariable, setIsVariable] = useState(priceItem.price_won === null);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push("/admin/price");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <label htmlFor="name" className="form-label">
          항목명 (최대 100자)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={priceItem.name}
          disabled={isPending}
          className="form-input-lg w-full disabled:opacity-50"
          placeholder="예: 일반 청소"
        />
        {state && "errors" in state && state.errors?.name && (
          <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="price_won" className="form-label">
          최소 가격 (원)
        </label>
        <input
          id="price_won"
          name="price_won"
          type="number"
          min="0"
          max="99999999"
          step="1000"
          required={!isVariable}
          defaultValue={priceItem.price_won ?? ""}
          disabled={isPending || isVariable}
          className="form-input-lg w-full disabled:opacity-50"
          placeholder="예: 200000"
        />
        <p className="mt-2 text-xs text-slate-400">
          입력하신 금액에 자동으로 콤마와 &ldquo;원~&rdquo;이 붙어 표시됩니다.
          (예: 200,000원~)
        </p>
        {state && "errors" in state && state.errors?.price_won && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.price_won[0]}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <input
            id="is_variable"
            name="is_variable"
            type="checkbox"
            value="true"
            checked={isVariable}
            onChange={(e) => setIsVariable(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 disabled:opacity-50"
          />
          <label htmlFor="is_variable" className="text-xs text-slate-600">
            가격 미정 (&ldquo;현장 견적&rdquo;으로 표시)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="sort_order" className="form-label">
          표시 순서
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min="0"
          max="9999"
          defaultValue={priceItem.sort_order}
          disabled={isPending}
          className="form-input-lg w-full disabled:opacity-50"
        />
        {state && "errors" in state && state.errors?.sort_order && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.sort_order[0]}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            value="true"
            defaultChecked={priceItem.is_published}
            disabled={isPending}
            className="h-5 w-5 disabled:opacity-50"
          />
          <label
            htmlFor="is_published"
            className="text-sm font-bold text-slate-900"
          >
            공개
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          체크 해제 시 가격표 페이지에 노출되지 않습니다.
        </p>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-8 py-4 disabled:cursor-not-allowed disabled:opacity-70"
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
          className="btn-outline px-8 py-4"
        >
          취소
        </button>
      </div>
    </form>
  );
}
