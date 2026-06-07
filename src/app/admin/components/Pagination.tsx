import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-3 text-xs text-slate-500 tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
        aria-label="다음 페이지"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
