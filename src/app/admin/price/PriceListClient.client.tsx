"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Eye, EyeOff, Loader2, GripVertical } from "lucide-react";
import {
  deletePriceItem,
  togglePriceItemPublished,
  reorderPriceItems,
} from "@/shared/actions/price";
import { formatPriceWon } from "@/shared/lib/pure/format";
import { useDragReorder } from "@/shared/lib/hooks/useDragReorder";
import type { PriceItemRow } from "@/shared/types/database";

interface PriceListClientProps {
  items: PriceItemRow[];
}

export function PriceListClient({
  items: initialItems,
}: PriceListClientProps): React.ReactElement {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    items,
    isSaving,
    dragIndex,
    dragOverIndex,
    onDragStart,
    onDragEnter,
    onDragEnd,
  } = useDragReorder(initialItems, (updated) =>
    reorderPriceItems(
      updated.map((item, i) => ({ id: item.id, sort_order: i })),
    ),
  );

  const handleDelete = async (itemId: string): Promise<void> => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(itemId);
    try {
      const result = await deletePriceItem(itemId);
      if (!result.success) {
        alert(result.error ?? "삭제 중 오류가 발생했습니다.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("가격표 삭제 중 예외 발생:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublished = async (
    itemId: string,
    currentPublished: boolean,
  ): Promise<void> => {
    setTogglingId(itemId);
    try {
      const result = await togglePriceItemPublished(itemId, !currentPublished);
      if (!result.success) {
        alert(result.error ?? "공개 상태 변경 중 오류가 발생했습니다.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("가격표 공개 상태 변경 중 예외 발생:", err);
      alert("공개 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="border border-slate-200">
      {isSaving && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <Loader2 size={12} className="animate-spin" />
          순서 저장 중...
        </div>
      )}

      <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 p-4 md:grid">
        <div className="text-label col-span-1 text-slate-500">순서</div>
        <div className="text-label col-span-5 text-slate-500">서비스명</div>
        <div className="text-label col-span-2 text-slate-500">가격</div>
        <div className="text-label col-span-1 text-center text-slate-500">
          공개
        </div>
        <div className="text-label col-span-1 text-slate-500">등록일</div>
        <div className="text-label col-span-2 text-right text-slate-500">
          작업
        </div>
      </div>

      <ul role="list" className="divide-y divide-slate-200">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`cursor-grab space-y-3 p-4 transition-colors active:cursor-grabbing md:grid md:grid-cols-12 md:items-center md:gap-4 md:space-y-0 ${
              dragIndex === index
                ? "bg-slate-50 opacity-50"
                : dragOverIndex === index
                  ? "border-t-2 border-t-slate-900"
                  : ""
            }`}
          >
            <div className="flex items-start gap-3 md:hidden">
              <GripVertical
                size={16}
                className="mt-1 shrink-0 text-slate-300"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatPriceWon(item.price_won)}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleTogglePublished(item.id, item.is_published)
                      }
                      disabled={togglingId === item.id}
                      className="inline-flex items-center gap-1 text-xs text-slate-500"
                    >
                      {togglingId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : item.is_published ? (
                        <Eye size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/admin/price/${item.id}/edit`}
                      className="rounded border border-slate-200 p-2 text-slate-500"
                    >
                      <Edit size={12} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded border border-slate-200 p-2 text-slate-500 disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:col-span-1 md:flex md:items-center md:gap-2">
              <GripVertical
                size={16}
                className="shrink-0 text-slate-300 hover:text-slate-500"
              />
              <span className="text-xs text-slate-400">{index}</span>
            </div>

            <div className="hidden md:col-span-5 md:block">
              <p className="line-clamp-1 text-sm font-bold text-slate-900">
                {item.name}
              </p>
            </div>

            <div className="hidden md:col-span-2 md:block">
              <p className="line-clamp-1 text-sm text-slate-600 tabular-nums">
                {formatPriceWon(item.price_won)}
              </p>
            </div>

            <div className="hidden md:col-span-1 md:block md:text-center">
              <button
                type="button"
                onClick={() =>
                  handleTogglePublished(item.id, item.is_published)
                }
                disabled={togglingId === item.id}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
              >
                {togglingId === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : item.is_published ? (
                  <Eye size={14} />
                ) : (
                  <EyeOff size={14} />
                )}
                {item.is_published ? "공개" : "비공개"}
              </button>
            </div>

            <div className="hidden md:col-span-1 md:block">
              <span className="text-xs text-slate-500">
                {new Date(item.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
              <Link
                href={`/admin/price/${item.id}/edit`}
                className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
              >
                <Edit size={14} />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
              >
                {deletingId === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
