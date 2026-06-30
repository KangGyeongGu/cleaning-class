"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TagManagerProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  maxLength?: number;
  inputId?: string;
  placeholder?: string;
  error?: string;
}

export function TagManager({
  label,
  tags,
  onAdd,
  onRemove,
  maxLength = 30,
  inputId = "tagInput",
  placeholder,
  error,
}: TagManagerProps): React.ReactElement {
  const [value, setValue] = useState("");

  function commitAdd(): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-3 block text-xs font-bold tracking-widest text-slate-900 uppercase"
      >
        {label}
      </label>
      <div className="mb-3 flex gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          maxLength={maxLength}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!e.nativeEvent.isComposing) {
                commitAdd();
              }
            }
          }}
          className="form-input-lg flex-1"
          placeholder={
            placeholder ??
            `태그 입력 후 추가 버튼 클릭 또는 Enter (최대 ${maxLength}자)`
          }
        />
        <Button
          variant="outline"
          size="none"
          onClick={commitAdd}
          aria-label="태그 추가"
          className="px-4 py-2 text-xs hover:bg-slate-900 hover:text-white"
        >
          <Plus size={14} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-slate-500 hover:text-slate-900"
              aria-label={`${tag} 태그 삭제`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
