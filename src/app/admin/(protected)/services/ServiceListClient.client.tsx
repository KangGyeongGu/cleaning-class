"use client";

import Image from "next/image";
import { GripVertical } from "lucide-react";
import {
  deleteService,
  toggleServicePublish,
  reorderServices,
} from "@/shared/actions/service";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { Spinner } from "@/components/ui/Spinner";
import { useDragReorder } from "@/shared/lib/hooks/useDragReorder";
import { useListRowActions } from "@/shared/lib/hooks/useListRowActions";
import { RowActions } from "@/app/admin/components/RowActions";
import type { Service } from "@/shared/types/database";

interface ServiceListClientProps {
  services: (Service & { imageUrl: string })[];
}

export function ServiceListClient({
  services: initialServices,
}: ServiceListClientProps) {
  const { deletingId, togglingId, runDelete, runToggle } = useListRowActions();

  const {
    items: services,
    isSaving,
    dragIndex,
    dragOverIndex,
    onDragStart,
    onDragEnter,
    onDragEnd,
  } = useDragReorder(initialServices, (updated) =>
    reorderServices(updated.map((s) => s.id)),
  );

  const handleDelete = (serviceId: string): Promise<void> =>
    runDelete(serviceId, () => deleteService(serviceId), {
      confirmMessage: "정말 삭제하시겠습니까?",
      errorMessage: "삭제 중 오류가 발생했습니다.",
      logLabel: "서비스 삭제 중 예외 발생:",
    });

  const handleTogglePublish = (
    serviceId: string,
    currentStatus: boolean,
  ): Promise<void> =>
    runToggle(
      serviceId,
      () => toggleServicePublish(serviceId, !currentStatus),
      {
        errorMessage: "게시 상태 변경 중 오류가 발생했습니다.",
        logLabel: "서비스 게시 상태 변경 중 예외 발생:",
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
        <div className="text-label col-span-1 text-slate-500">이미지</div>
        <div className="text-label col-span-2 text-slate-500">서비스명</div>
        <div className="text-label col-span-1 text-slate-500">카테고리</div>
        <div className="text-label col-span-3 text-slate-500">태그</div>
        <div className="text-label col-span-1 text-center text-slate-500">
          게시
        </div>
        <div className="text-label col-span-1 text-slate-500">등록일</div>
        <div className="text-label col-span-2 text-right text-slate-500">
          작업
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {services.map((service, index) => (
          <div
            key={service.id}
            role="listitem"
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
              <div className="relative aspect-square h-12 w-12 shrink-0 border border-slate-200 bg-slate-100">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                    없음
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {service.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-400">
                    {service.category === "moving" ? "이사" : "청소"}
                  </span>
                  {(service.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PublishToggle
                      isPublished={service.is_published}
                      isLoading={togglingId === service.id}
                      onToggle={() =>
                        handleTogglePublish(service.id, service.is_published)
                      }
                    />
                    <span className="text-[10px] text-slate-400">
                      {new Date(service.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <RowActions
                      variant="mobile"
                      editHref={`/admin/services/${service.id}/edit`}
                      editLabel="서비스 수정"
                      deleteLabel="서비스 삭제"
                      onDelete={() => handleDelete(service.id)}
                      isDeleting={deletingId === service.id}
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

            <div className="hidden md:col-span-1 md:block">
              <div className="relative aspect-square h-16 w-16 border border-slate-200 bg-slate-100">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    없음
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:col-span-2 md:block">
              <p className="text-sm font-bold text-slate-900">
                {service.title}
              </p>
            </div>

            <div className="hidden md:col-span-1 md:block">
              <span className="text-xs text-slate-500">
                {service.category === "moving" ? "이사" : "청소"}
              </span>
            </div>

            <div className="hidden md:col-span-3 md:block">
              <div className="flex flex-wrap gap-1">
                {(service.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-100 px-2 py-0.5 text-xs whitespace-nowrap text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden md:col-span-1 md:block md:text-center">
              <PublishToggle
                isPublished={service.is_published}
                isLoading={togglingId === service.id}
                onToggle={() =>
                  handleTogglePublish(service.id, service.is_published)
                }
                size={14}
                label={service.is_published ? "게시" : "비공개"}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
              />
            </div>

            <div className="hidden md:col-span-1 md:block">
              <span className="text-xs text-slate-500">
                {new Date(service.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="hidden md:col-span-2 md:flex md:justify-end md:gap-2">
              <RowActions
                variant="desktop"
                editHref={`/admin/services/${service.id}/edit`}
                editLabel="서비스 수정"
                deleteLabel="서비스 삭제"
                onDelete={() => handleDelete(service.id)}
                isDeleting={deletingId === service.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
