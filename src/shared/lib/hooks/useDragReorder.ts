import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseDragReorderResult<T> {
  items: T[];

  isSaving: boolean;

  dragIndex: number | null;

  dragOverIndex: number | null;

  onDragStart: (index: number) => void;

  onDragEnter: (index: number) => void;

  onDragEnd: () => Promise<void>;
}

export function useDragReorder<T>(
  initialItems: T[],
  onReorder: (orderedItems: T[]) => Promise<{
    success: boolean;
    error?: string;
  }>,
): UseDragReorderResult<T> {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  useEffect(() => setItems(initialItems), [initialItems]);

  const [isSaving, setIsSaving] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDragStart = (index: number): void => {
    if (isSaving) return;
    dragItem.current = index;
    setDragIndex(index);
  };

  const onDragEnter = (index: number): void => {
    if (isSaving) return;
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const onDragEnd = async (): Promise<void> => {
    const from = dragItem.current;
    const to = dragOverItem.current;

    dragItem.current = null;
    dragOverItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);

    if (from === null || to === null || from === to) return;

    const updated = [...items];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setItems(updated);

    setIsSaving(true);
    try {
      const result = await onReorder(updated);
      if (!result.success) {
        alert(result.error ?? "순서 변경 중 오류가 발생했습니다.");
        setItems(initialItems);
      }
      router.refresh();
    } catch (err) {
      console.error("[useDragReorder] error:", err);
      alert("순서 변경 중 오류가 발생했습니다.");
      setItems(initialItems);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    items,
    isSaving,
    dragIndex,
    dragOverIndex,
    onDragStart,
    onDragEnter,
    onDragEnd,
  };
}
