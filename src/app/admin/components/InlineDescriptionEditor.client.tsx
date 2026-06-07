"use client";

import { useState } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";

interface InlineDescriptionEditorProps {
  initialValue: string;
  placeholder: string;
  emptyText: string;
  onSave: (value: string) => Promise<{ success: boolean; error?: string }>;
}

export function InlineDescriptionEditor({
  initialValue,
  placeholder,
  emptyText,
  onSave,
}: InlineDescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave(draft);
      if (result.success) {
        setValue(draft);
        setIsEditing(false);
      } else {
        alert(result.error || "저장 중 오류가 발생했습니다.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mb-8 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 border border-slate-300 px-3 py-2 text-sm font-light text-slate-600 transition-colors focus:border-slate-900 focus:outline-none"
          placeholder={placeholder}
          autoFocus
        />
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="p-2 text-slate-400 transition-colors hover:text-slate-900 disabled:opacity-50"
          title="취소"
        >
          <X size={16} />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 text-slate-400 transition-colors hover:text-green-600 disabled:opacity-50"
          title="저장"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 flex items-center gap-2">
      <p className="text-sm font-light text-slate-500">{value || emptyText}</p>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="p-1 text-slate-400 transition-colors hover:text-slate-900"
        title="안내 문구 수정"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}
