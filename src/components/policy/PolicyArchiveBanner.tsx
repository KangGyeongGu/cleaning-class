import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PolicyArchiveBannerProps {
  effectiveUntil: string;
  currentHref: string;
}

export function PolicyArchiveBanner({
  effectiveUntil,
  currentHref,
}: PolicyArchiveBannerProps): React.ReactElement {
  return (
    <aside
      role="note"
      className="mb-8 border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
    >
      <p className="mb-2 font-medium text-slate-900">
        이 정책은 {effectiveUntil} 까지 시행된 이전 버전입니다.
      </p>
      <Link
        href={currentHref}
        className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-slate-700 underline decoration-slate-400 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-900"
      >
        현재 시행 중인 정책 보기
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </aside>
  );
}
