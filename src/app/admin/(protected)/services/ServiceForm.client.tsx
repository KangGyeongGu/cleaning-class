"use client";

import { useState } from "react";
import { createService, updateService } from "@/shared/actions/service";
import { AdminEditor } from "@/app/admin/components/AdminEditor.client";
import { ServiceFormFields } from "@/app/admin/(protected)/services/ServiceFormFields.client";
import type { Service } from "@/shared/types/database";

interface Props {
  service?: Service;
  defaultSortOrder?: number;
  imageUrl?: string;
  afterImageUrl?: string;
  detailImageUrl?: string;
  detailAfterImageUrl?: string;
}

export function ServiceForm({ service, ...props }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <AdminEditor
      title={service ? "서비스 수정" : "서비스 등록"}
      returnHref="/admin/services"
      busy={busy}
      action={
        service ? updateService.bind(null, String(service.id)) : createService
      }
    >
      {(errors, markChanged) => (
        <ServiceFormFields
          {...props}
          service={service}
          errors={errors}
          onChanged={markChanged}
          onBusyChange={setBusy}
        />
      )}
    </AdminEditor>
  );
}
