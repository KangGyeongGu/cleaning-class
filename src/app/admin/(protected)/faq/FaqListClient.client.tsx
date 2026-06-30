"use client";

import { GripVertical } from "lucide-react";
import { deleteFaq, toggleFaqActive, reorderFaqs } from "@/shared/actions/faq";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { Spinner } from "@/components/ui/Spinner";
import { useDragReorder } from "@/shared/lib/hooks/useDragReorder";
import { useListRowActions } from "@/shared/lib/hooks/useListRowActions";
import { RowActions } from "@/app/admin/components/RowActions";
import type { FaqRow } from "@/shared/types/database";

interface FaqListClientProps {
  faqs: FaqRow[];
}

export function FaqListClient({ faqs: initialFaqs }: FaqListClientProps) {
  const { deletingId, togglingId, runDelete, runToggle } = useListRowActions();

  const {
    items: faqs,
    isSaving,
    dragIndex,
    dragOverIndex,
    onDragStart,
    onDragEnter,
    onDragEnd,
  } = useDragReorder(initialFaqs, (updated) =>
    reorderFaqs(updated.map((faq, i) => ({ id: faq.id, display_order: i }))),
  );

  const handleDelete = (faqId: string): Promise<void> =>
    runDelete(faqId, () => deleteFaq(faqId), {
      confirmMessage: "정말 삭제하시겠습니까?",
      errorMessage: "삭제 중 오류가 발생했습니다.",
      logLabel: "FAQ 삭제 중 예외 발생:",
    });

  const handleToggleActive = (
    faqId: string,
    currentActive: boolean,
  ): Promise<void> =>
    runToggle(faqId, () => toggleFaqActive(faqId, !currentActive), {
      errorMessage: "활성 상태 변경 중 오류가 발생했습니다.",
      logLabel: "FAQ 활성 상태 변경 중 예외 발생:",
    });

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
        <div className="text-label col-span-4 text-slate-500">질문</div>
        <div className="text-label col-span-3 text-slate-500">
          답변 미리보기
        </div>
        <div className="text-label col-span-1 text-center text-slate-500">
          활성
        </div>
        <div className="text-label col-span-1 text-slate-500">등록일</div>
        <div className="text-label col-span-2 text-right text-slate-500">
          작업
        </div>
      </div>

      <ul role="list" className="divide-y divide-slate-200">
        {faqs.map((faq, index) => (
          <li
            key={faq.id}
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
                <p className="line-clamp-2 text-sm font-bold text-slate-900">
                  {faq.question}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {faq.answer}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PublishToggle
                      isPublished={faq.is_active}
                      isLoading={togglingId === faq.id}
                      onToggle={() => handleToggleActive(faq.id, faq.is_active)}
                    />
                    <span className="text-[10px] text-slate-400">
                      {new Date(faq.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <RowActions
                      variant="mobile"
                      editHref={`/admin/faq/${faq.id}/edit`}
                      editLabel="FAQ 수정"
                      deleteLabel="FAQ 삭제"
                      onDelete={() => handleDelete(faq.id)}
                      isDeleting={deletingId === faq.id}
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

            <div className="hidden md:col-span-4 md:block">
              <p className="line-clamp-2 text-sm font-bold text-slate-900">
                {faq.question}
              </p>
            </div>

            <div className="hidden md:col-span-3 md:block">
              <p className="line-clamp-2 text-xs text-slate-500">
                {faq.answer}
              </p>
            </div>

            <div className="hidden md:col-span-1 md:block md:text-center">
              <PublishToggle
                isPublished={faq.is_active}
                isLoading={togglingId === faq.id}
                onToggle={() => handleToggleActive(faq.id, faq.is_active)}
                size={14}
                label={faq.is_active ? "활성" : "비활성"}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
              />
            </div>

            <div className="hidden md:col-span-1 md:block">
              <span className="text-xs text-slate-500">
                {new Date(faq.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
              <RowActions
                variant="desktop"
                editHref={`/admin/faq/${faq.id}/edit`}
                editLabel="FAQ 수정"
                deleteLabel="FAQ 삭제"
                onDelete={() => handleDelete(faq.id)}
                isDeleting={deletingId === faq.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
