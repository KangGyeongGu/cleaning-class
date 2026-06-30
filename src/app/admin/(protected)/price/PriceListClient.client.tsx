"use client";

import { GripVertical } from "lucide-react";
import {
  deletePriceItem,
  togglePriceItemPublished,
  reorderPriceItems,
} from "@/shared/actions/price";
import { formatPriceWon } from "@/shared/lib/pure/format";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { Spinner } from "@/components/ui/Spinner";
import { useDragReorder } from "@/shared/lib/hooks/useDragReorder";
import { useListRowActions } from "@/shared/lib/hooks/useListRowActions";
import { RowActions } from "@/app/admin/components/RowActions";
import type { PriceItemRow } from "@/shared/types/database";

interface PriceListClientProps {
  items: PriceItemRow[];
}

export function PriceListClient({
  items: initialItems,
}: PriceListClientProps): React.ReactElement {
  const { deletingId, togglingId, runDelete, runToggle } = useListRowActions();

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

  const handleDelete = (itemId: string): Promise<void> =>
    runDelete(itemId, () => deletePriceItem(itemId), {
      confirmMessage: "정말 삭제하시겠습니까?",
      errorMessage: "삭제 중 오류가 발생했습니다.",
      logLabel: "가격표 삭제 중 예외 발생:",
    });

  const handleTogglePublished = (
    itemId: string,
    currentPublished: boolean,
  ): Promise<void> =>
    runToggle(
      itemId,
      () => togglePriceItemPublished(itemId, !currentPublished),
      {
        errorMessage: "공개 상태 변경 중 오류가 발생했습니다.",
        logLabel: "가격표 공개 상태 변경 중 예외 발생:",
      },
    );

  return (
    <div className="border border-slate-200">
      {isSaving && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <Spinner size={12} />
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
                    <PublishToggle
                      isPublished={item.is_published}
                      isLoading={togglingId === item.id}
                      onToggle={() =>
                        handleTogglePublished(item.id, item.is_published)
                      }
                    />
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <RowActions
                      variant="mobile"
                      editHref={`/admin/price/${item.id}/edit`}
                      editLabel="가격 항목 수정"
                      deleteLabel="가격 항목 삭제"
                      onDelete={() => handleDelete(item.id)}
                      isDeleting={deletingId === item.id}
                    />
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
              <PublishToggle
                isPublished={item.is_published}
                isLoading={togglingId === item.id}
                onToggle={() =>
                  handleTogglePublished(item.id, item.is_published)
                }
                size={14}
                label={item.is_published ? "공개" : "비공개"}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
              />
            </div>

            <div className="hidden md:col-span-1 md:block">
              <span className="text-xs text-slate-500">
                {new Date(item.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
              <RowActions
                variant="desktop"
                editHref={`/admin/price/${item.id}/edit`}
                editLabel="가격 항목 수정"
                deleteLabel="가격 항목 삭제"
                onDelete={() => handleDelete(item.id)}
                isDeleting={deletingId === item.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
