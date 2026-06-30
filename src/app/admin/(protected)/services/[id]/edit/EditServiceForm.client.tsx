"use client";

import { useRouter } from "next/navigation";
import { updateService } from "@/shared/actions/service";
import { useAdminForm } from "@/shared/lib/hooks/useAdminForm";
import { Button } from "@/components/ui/Button";
import { ServiceFormFields } from "@/app/admin/(protected)/services/ServiceFormFields.client";
import type { Service } from "@/shared/types/database";

interface EditServiceFormProps {
  service: Service;
  imageUrl: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
}

export function EditServiceForm({
  service,
  imageUrl,
  afterImageUrl,
  detailImageUrl,
  detailAfterImageUrl,
}: EditServiceFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useAdminForm(
    updateService.bind(null, String(service.id)),
    "/admin/services",
  );
  const errors = state && "errors" in state ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-8">
      <ServiceFormFields
        service={service}
        imageUrl={imageUrl}
        afterImageUrl={afterImageUrl}
        detailImageUrl={detailImageUrl}
        detailAfterImageUrl={detailAfterImageUrl}
        errors={errors}
      />

      {state && "error" in state && state.error && (
        <p className="form-error text-sm">{state.error}</p>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" loading={isPending}>
          {isPending ? "수정 중..." : "수정"}
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
