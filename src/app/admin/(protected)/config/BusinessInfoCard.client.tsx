"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateSiteConfig } from "@/shared/actions/site-config";
import { formatPhoneNumber } from "@/shared/lib/pure/format";
import { Modal } from "@/app/admin/components/Modal.client";
import {
  FormField,
  ModalFooter,
} from "@/app/admin/components/FormField.client";
import { Card } from "@/components/ui/Card";
import type { SiteConfig } from "@/shared/types/database";

type ConfigActionState = Awaited<ReturnType<typeof updateSiteConfig>>;

interface BusinessInfoCardProps {
  config: SiteConfig;
}

interface Row {
  label: string;
  value: string;
  multiline?: boolean;
}

function buildRows(config: SiteConfig): Row[] {
  const empty = "—";
  return [
    { label: "업체명", value: config.business_name || empty },
    { label: "대표자명", value: config.representative || empty },
    {
      label: "사업자번호",
      value: config.business_registration_number || empty,
    },
    { label: "전화번호", value: config.phone || empty },
    { label: "이메일", value: config.email || empty },
    { label: "블로그 URL", value: config.blog_url || empty },
    { label: "인스타그램 URL", value: config.instagram_url || empty },
    { label: "당근마켓 URL", value: config.daangn_url || empty },
    { label: "주소", value: config.address || empty },
    {
      label: "소개글",
      value: config.description || empty,
      multiline: true,
    },
  ];
}

function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function BusinessInfoCard({
  config,
}: BusinessInfoCardProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ConfigActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const result = await updateSiteConfig(state, formData);
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
          <h2 className="text-heading-3">청소업체 기본 정보</h2>
          <p className="mt-1 text-xs font-light text-slate-500">
            업체명, 대표자, 연락처 등 청소업체의 기본 정보입니다.
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
            <dd
              className={
                row.multiline
                  ? "text-sm font-light whitespace-pre-wrap text-slate-900"
                  : "truncate text-sm font-light text-slate-900"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="청소업체 기본 정보 수정"
        description="업체명, 연락처, SNS 링크 등을 수정합니다."
        size="lg"
      >
        <form action={formAction} className="space-y-6">
          <FormField
            id="business_name"
            label="업체명"
            required
            defaultValue={config.business_name}
            error={state?.errors?.business_name?.[0]}
            placeholder="업체명을 입력하세요"
          />
          <FormField
            id="representative"
            label="대표자명 (선택)"
            defaultValue={config.representative ?? ""}
            error={state?.errors?.representative?.[0]}
            placeholder="대표자명을 입력하세요"
          />
          <FormField
            id="business_registration_number"
            label="사업자번호 (선택)"
            defaultValue={config.business_registration_number ?? ""}
            error={state?.errors?.business_registration_number?.[0]}
            placeholder="000-00-00000"
            onInput={(e) => {
              e.currentTarget.value = formatBusinessNumber(
                e.currentTarget.value,
              );
            }}
          />
          <FormField
            id="phone"
            type="tel"
            label="전화번호"
            required
            defaultValue={config.phone}
            error={state?.errors?.phone?.[0]}
            placeholder="000-0000-0000"
            onInput={(e) => {
              e.currentTarget.value = formatPhoneNumber(e.currentTarget.value);
            }}
          />
          <FormField
            id="email"
            type="email"
            label="이메일"
            required
            defaultValue={config.email}
            error={state?.errors?.email?.[0]}
            placeholder="contact@example.com"
          />
          <FormField
            id="blog_url"
            type="url"
            label="블로그 URL (선택)"
            defaultValue={config.blog_url ?? ""}
            error={state?.errors?.blog_url?.[0]}
            placeholder="https://blog.naver.com/..."
          />
          <FormField
            id="instagram_url"
            type="url"
            label="인스타그램 URL (선택)"
            defaultValue={config.instagram_url ?? ""}
            error={state?.errors?.instagram_url?.[0]}
            placeholder="https://instagram.com/..."
          />
          <FormField
            id="daangn_url"
            type="url"
            label="당근마켓 URL (선택)"
            defaultValue={config.daangn_url ?? ""}
            error={state?.errors?.daangn_url?.[0]}
            placeholder="https://www.daangn.com/..."
          />
          <FormField
            id="address"
            label="주소 (선택)"
            defaultValue={config.address ?? ""}
            error={state?.errors?.address?.[0]}
            placeholder="전북특별자치도 전주시 완산구 ..."
          />
          <div>
            <label
              htmlFor="description"
              className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
            >
              소개글 (최대 500자, 선택)
            </label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={config.description ?? ""}
              className="form-input-lg resize-none text-base"
              placeholder="업체 소개글을 입력하세요"
            />
            {state?.errors?.description && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.description[0]}
              </p>
            )}
          </div>

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
