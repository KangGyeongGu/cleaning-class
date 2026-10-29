"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { OutlinedField } from "@/components/ui/OutlinedField";
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
      <div className="mb-3 flex items-start gap-2">
        <OutlinedField
          id={inputId}
          label={label}
          error={error}
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
          className="flex-1"
          placeholder={placeholder ?? "태그 입력"}
        />
        <Button
          variant="outline"
          size="none"
          onClick={commitAdd}
          aria-label="태그 추가"
          className="mt-2 h-11 px-4 text-xs"
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
    </div>
  );
}
