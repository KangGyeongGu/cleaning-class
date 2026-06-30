"use client";

import { useRouter } from "next/navigation";
import { createService } from "@/shared/actions/service";
import { useAdminForm } from "@/shared/lib/hooks/useAdminForm";
import { Button } from "@/components/ui/Button";
import { ServiceFormFields } from "@/app/admin/(protected)/services/ServiceFormFields.client";

interface NewServiceFormProps {
  defaultSortOrder?: number;
}

export function NewServiceForm({ defaultSortOrder = 0 }: NewServiceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useAdminForm(
    createService,
    "/admin/services",
  );
  const errors = state && "errors" in state ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-8">
      <ServiceFormFields defaultSortOrder={defaultSortOrder} errors={errors} />

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
        <Button
          type="button"
          variant="outline"
          className="hover:bg-slate-900 hover:text-white"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
