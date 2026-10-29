"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/app/admin/lib/useUnsavedChanges";
import { AdminButton } from "@/app/admin/components/AdminButton";

export interface EditorResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[] | undefined>;
}

interface Props {
  title: string;
  returnHref: string;
  busy?: boolean;
  action: (state: unknown, data: FormData) => Promise<EditorResult>;
  children: (
    errors: EditorResult["errors"],
    markChanged: () => void,
  ) => React.ReactNode;
}

export function AdminEditor({
  title,
  returnHref,
  action,
  children,
  busy = false,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const [result, setResult] = useState<EditorResult | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const markChanged = () => setDirty(true);

  useUnsavedChanges(dirty, pending);

  useEffect(() => {
    if (pending || !result || result.success) return;
    const name = Object.keys(result.errors ?? {}).find(
      (key) => result.errors?.[key]?.length,
    );
    const target = name ? formRef.current?.elements.namedItem(name) : null;
    if (target instanceof HTMLElement && !target.matches('[type="hidden"]'))
      target.focus();
    else if (
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    )
      formRef.current
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    else formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [pending, result]);

  function cancel() {
    if (
      pending ||
      (dirty && !window.confirm("변경사항을 저장하지 않고 취소하시겠습니까?"))
    )
      return;
    setDirty(false);
    router.push(returnHref);
  }

  return (
    <form
      ref={formRef}
      onChange={markChanged}
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current || busy) return;
        const data = new FormData(event.currentTarget);
        submitting.current = true;
        startTransition(async () => {
          try {
            const next = await action(result, data);
            setResult(next);
            if (next.success) {
              setDirty(false);
              router.push(returnHref);
              router.refresh();
            }
          } catch {
            setResult({
              success: false,
              error: "저장하지 못했습니다. 다시 시도해주세요.",
            });
          } finally {
            submitting.current = false;
          }
        });
      }}
      className="min-w-0"
    >
      <header className="sticky top-16 z-20 -mx-4 mb-6 flex items-center justify-between gap-4 bg-white/95 px-4 py-4 backdrop-blur-sm md:top-0 md:-mx-8 md:px-8">
        <h1 className="text-lg font-black text-slate-900 md:text-2xl">
          {title}
        </h1>
        <div className="flex shrink-0 gap-2">
          <AdminButton
            variant="outline"
            disabled={pending || busy || result?.success}
            onClick={cancel}
          >
            취소
          </AdminButton>
          <AdminButton
            variant="primary"
            type="submit"
            loading={pending}
            disabled={pending || busy || result?.success}
          >
            저장
          </AdminButton>
        </div>
      </header>
      {result && !result.success && (
        <p role="alert" tabIndex={-1} className="mb-5 text-sm text-red-600">
          {result.error ?? "입력 내용을 확인해주세요."}
        </p>
      )}
      <fieldset
        disabled={pending || busy || result?.success}
        className="min-w-0 space-y-8"
      >
        {children(result?.errors, markChanged)}
      </fieldset>
    </form>
  );
}
