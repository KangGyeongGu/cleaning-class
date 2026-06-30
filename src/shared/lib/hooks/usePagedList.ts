import { useMemo, useState } from "react";

interface UsePagedListResult<T> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageItems: T[];
}

export function usePagedList<T>(
  items: T[],
  perPage: number,
): UsePagedListResult<T> {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / perPage);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * perPage, safePage * perPage),
    [items, safePage, perPage],
  );

  return { page: safePage, setPage, totalPages, pageItems };
}
