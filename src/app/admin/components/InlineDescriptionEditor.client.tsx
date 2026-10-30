"use client";

import { useId, useState } from "react";
import { Pencil } from "lucide-react";
import { useUnsavedChanges } from "@/app/admin/lib/useUnsavedChanges";
import { AdminButton } from "@/app/admin/components/AdminButton";
import { OutlinedField } from "@/components/ui/OutlinedField";

interface InlineDescriptionEditorProps {
  initialValue: string;
  placeholder: string;
  emptyText: string;
  label?: string;
  labelHidden?: boolean;
  maxLength?: number;
  onSave: (value: string) => Promise<{ success: boolean; error?: string }>;
}

export function InlineDescriptionEditor({
  initialValue,
  placeholder,
  emptyText,
  label = "안내 문구",
  labelHidden = false,
  maxLength,
  onSave,
}: InlineDescriptionEditorProps) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState({
    source: initialValue,
    value: initialValue,
  });
  const value = saved.source === initialValue ? saved.value : initialValue;
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useUnsavedChanges(editing && draft !== value, saving);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const result = await onSave(draft);
      if (result.success) {
        setSaved({ source: initialValue, value: draft });
        setEditing(false);
      } else
        setError(result.error || "저장하지 못했습니다. 다시 시도해주세요.");
    } catch {
      setError("저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6">
      {editing ? (
        <form onSubmit={save} className="flex items-start gap-2">
          <OutlinedField
            id={id}
            label={label}
            labelHidden={labelHidden}
            value={draft}
            maxLength={maxLength}
            disabled={saving}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <div className="flex shrink-0 gap-2 pt-2">
            <AdminButton
              size="field"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setDraft(value);
                setError(undefined);
                setEditing(false);
              }}
            >
              취소
            </AdminButton>
            <AdminButton
              size="field"
              variant="primary"
              type="submit"
              loading={saving}
            >
              저장
            </AdminButton>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2">
          <p className="py-1 text-sm leading-relaxed text-slate-500">
            {value || emptyText}
          </p>
          <button
            type="button"
            aria-label="안내 문구 수정"
            onClick={() => {
              setDraft(value);
              setError(undefined);
              setEditing(true);
            }}
            className="shrink-0 p-2 text-slate-400 transition-colors hover:text-slate-900"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
