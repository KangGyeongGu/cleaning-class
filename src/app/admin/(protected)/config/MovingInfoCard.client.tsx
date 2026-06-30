"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateMovingSiteConfig } from "@/shared/actions/site-config";
import { formatPhoneNumber } from "@/shared/lib/pure/format";
import { Modal } from "@/app/admin/components/Modal.client";
import {
  FormField,
  ModalFooter,
} from "@/app/admin/components/FormField.client";
import { Card } from "@/components/ui/Card";
import type { SiteConfig } from "@/shared/types/database";

type MovingActionState = Awaited<ReturnType<typeof updateMovingSiteConfig>>;

interface MovingInfoCardProps {
  config: SiteConfig;
}

interface Row {
  label: string;
  value: string;
}

function buildRows(config: SiteConfig): Row[] {
  const empty = "—";
  return [
    { label: "대표자명", value: config.moving_representative || empty },
    { label: "전화번호", value: config.moving_phone || empty },
    {
      label: "사업자등록번호",
      value: config.moving_business_registration_number || empty,
    },
    { label: "주소", value: config.moving_address || empty },
  ];
}

function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function MovingInfoCard({
  config,
}: MovingInfoCardProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<MovingActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await updateMovingSiteConfig(state, formData);
      setState(result);
      if (result && "message" in result && result.message) {
        setIsOpen(false);
      }
    });
  }

  const rows = buildRows(config);

  return (
    <Card>
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-heading-3">이사업체 정보</h2>
          <p className="mt-1 text-xs font-light text-slate-500">
            이사 서비스 견적문의 및 연락처 정보에 표시되는 이사업체 정보입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 border border-slate-300 px-3 py-1.5 text-xs font-bold tracking-widest text-slate-700 uppercase transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </button>
      </header>

      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[7rem_1fr] gap-4 px-6 py-3 md:grid-cols-[9rem_1fr]"
          >
            <dt className="text-label text-slate-500">{row.label}</dt>
            <dd className="truncate text-sm font-light text-slate-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="이사업체 정보 수정"
        description="이사 서비스 견적·연락처에 표시되는 정보를 수정합니다."
        size="lg"
      >
        <form action={formAction} className="space-y-6">
          <FormField
            id="moving_representative"
            label="대표자명 (선택)"
            defaultValue={config.moving_representative ?? ""}
            error={state?.errors?.moving_representative?.[0]}
            placeholder="대표자명을 입력하세요"
          />
          <FormField
            id="moving_phone"
            type="tel"
            label="전화번호 (선택)"
            defaultValue={config.moving_phone ?? ""}
            error={state?.errors?.moving_phone?.[0]}
            placeholder="000-0000-0000"
            onInput={(e) => {
              e.currentTarget.value = formatPhoneNumber(e.currentTarget.value);
            }}
          />
          <FormField
            id="moving_business_registration_number"
            label="사업자등록번호 (선택)"
            defaultValue={config.moving_business_registration_number ?? ""}
            error={state?.errors?.moving_business_registration_number?.[0]}
            placeholder="000-00-00000"
            onInput={(e) => {
              e.currentTarget.value = formatBusinessNumber(
                e.currentTarget.value,
              );
            }}
          />
          <FormField
            id="moving_address"
            label="주소 (선택)"
            defaultValue={config.moving_address ?? ""}
            error={state?.errors?.moving_address?.[0]}
            placeholder="전북특별자치도 전주시 완산구 ..."
          />

          {state && "error" in state && state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <ModalFooter
            isPending={isPending}
            onCancel={() => setIsOpen(false)}
          />
        </form>
      </Modal>
    </Card>
  );
}
