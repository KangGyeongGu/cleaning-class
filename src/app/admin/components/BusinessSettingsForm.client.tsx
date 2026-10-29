"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMovingSiteConfig,
  updateSiteConfig,
} from "@/shared/actions/site-config";
import { formatPhoneNumber } from "@/shared/lib/pure/format";
import { OutlinedField } from "@/components/ui/OutlinedField";
import { Button } from "@/components/ui/Button";
import type { SiteConfig } from "@/shared/types/database";

type EditableField =
  | "business_name"
  | "representative"
  | "business_registration_number"
  | "phone"
  | "email"
  | "address"
  | "blog_url"
  | "instagram_url"
  | "daangn_url"
  | "moving_representative"
  | "moving_phone"
  | "moving_business_registration_number"
  | "moving_address";
type FieldValues = Partial<Record<EditableField, string>>;

interface Field {
  name: EditableField;
  label: string;
  type?: "text" | "tel" | "email" | "url";
  required?: boolean;
  wide?: boolean;
  maxLength?: number;
  format?: (value: string) => string;
}
interface Group {
  title: string;
  fields: Field[];
}

function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const CLEANING_GROUPS: Group[] = [
  {
    title: "기본 정보",
    fields: [
      { name: "business_name", label: "업체명", required: true },
      { name: "representative", label: "대표자명", maxLength: 50 },
      {
        name: "business_registration_number",
        label: "사업자등록번호",
        format: formatBusinessNumber,
      },
      {
        name: "phone",
        label: "전화번호",
        type: "tel",
        required: true,
        format: formatPhoneNumber,
      },
      {
        name: "email",
        label: "이메일",
        type: "email",
        required: true,
        wide: true,
      },
      { name: "address", label: "주소", wide: true, maxLength: 200 },
    ],
  },
  {
    title: "외부 링크",
    fields: [
      { name: "blog_url", label: "블로그", type: "url", wide: true },
      { name: "instagram_url", label: "인스타그램", type: "url", wide: true },
      { name: "daangn_url", label: "당근", type: "url", wide: true },
    ],
  },
];
const MOVING_GROUPS: Group[] = [
  {
    title: "기본 정보",
    fields: [
      { name: "moving_representative", label: "대표자명", maxLength: 50 },
      {
        name: "moving_phone",
        label: "전화번호",
        type: "tel",
        format: formatPhoneNumber,
      },
      {
        name: "moving_business_registration_number",
        label: "사업자등록번호",
        format: formatBusinessNumber,
      },
      { name: "moving_address", label: "주소", wide: true, maxLength: 200 },
    ],
  },
];

type SettingsState = {
  success: boolean;
  error?: string;
  errors?: Record<string, string[] | undefined>;
};
interface Props {
  kind: "cleaning" | "moving";
  config: SiteConfig;
  onSavingChange: (saving: boolean) => void;
  id: string;
  onChanged: (kind: "cleaning" | "moving", changed: boolean) => void;
  onAddressSearch: (onSelect: (address: string) => void) => void;
}

export function BusinessSettingsForm({
  kind,
  config,
  onSavingChange,
  id,
  onChanged,
  onAddressSearch,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const groups = kind === "cleaning" ? CLEANING_GROUPS : MOVING_GROUPS;
  const [values, setValues] = useState<FieldValues>(() =>
    Object.fromEntries(
      groups.flatMap((group) =>
        group.fields.map((field) => [
          field.name,
          String(config[field.name] ?? ""),
        ]),
      ),
    ),
  );
  const [saved, setSaved] = useState(values);
  const [state, setState] = useState<SettingsState | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = groups.some((group) =>
    group.fields.some(({ name }) => values[name] !== saved[name]),
  );

  useEffect(() => {
    onChanged(kind, changed);
  }, [kind, changed, onChanged]);

  useEffect(() => {
    if (pending || !state?.errors) return;
    const firstError = Object.keys(state.errors)[0];
    if (firstError)
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstError}"]`)
        ?.focus();
  }, [pending, state]);

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        const action =
          kind === "cleaning" ? updateSiteConfig : updateMovingSiteConfig;
        const result = await action(state, formData);
        setState(result);
        if (result.success) {
          setSaved(values);
          router.refresh();
        }
      } catch {
        setState({
          success: false,
          error: "저장하지 못했습니다. 다시 시도해주세요.",
        });
      } finally {
        onSavingChange(false);
      }
    });
  }

  return (
    <form
      id={id}
      ref={formRef}
      action={submit}
      onSubmit={() => onSavingChange(true)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {state && (
          <p
            role={state.success ? "status" : "alert"}
            className={`mb-4 text-xs ${state.success ? "text-green-700" : "text-red-600"}`}
          >
            {state.success
              ? "저장되었습니다."
              : (state.error ?? "입력 내용을 확인해주세요.")}
          </p>
        )}
        <fieldset disabled={pending} className="min-w-0 space-y-7">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-4 text-sm font-bold text-slate-900">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const id = `settings-${field.name}`;
                  const error = state?.errors?.[field.name]?.[0];
                  const attributes = {
                    id,
                    name: field.name,
                    required: field.required,
                    maxLength: field.maxLength,
                    value: values[field.name],
                    label: field.label,
                    error,
                    className: field.wide ? "sm:col-span-2" : undefined,
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      const next = field.format
                        ? field.format(event.target.value)
                        : event.target.value;
                      setValues((current) => ({
                        ...current,
                        [field.name]: next,
                      }));
                      setState(null);
                    },
                  };
                  if (
                    field.name === "address" ||
                    field.name === "moving_address"
                  ) {
                    return (
                      <div
                        key={field.name}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:col-span-2"
                      >
                        <OutlinedField
                          {...attributes}
                          className={undefined}
                          autoComplete="street-address"
                        />
                        <Button
                          variant="outline"
                          size="none"
                          disabled={pending}
                          className="mt-2 h-11 px-3 text-xs"
                          onClick={() =>
                            onAddressSearch((address) => {
                              setValues((current) => ({
                                ...current,
                                [field.name]: address,
                              }));
                              setState(null);
                              requestAnimationFrame(() =>
                                formRef.current
                                  ?.querySelector<HTMLInputElement>(
                                    `[name="${field.name}"]`,
                                  )
                                  ?.focus(),
                              );
                            })
                          }
                        >
                          주소찾기
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <OutlinedField
                      key={field.name}
                      {...attributes}
                      type={field.type ?? "text"}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </fieldset>
      </div>
    </form>
  );
}
