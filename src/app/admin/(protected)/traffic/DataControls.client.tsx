"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

import { deleteTrafficBefore } from "@/shared/actions/traffic";
import { Card } from "@/components/ui/Card";

interface Props {
  oldestDate: string | null;
}

export function DataControls({ oldestDate }: Props): React.ReactElement {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    setConfirming(false);
    startTransition(async () => {
      const res = await deleteTrafficBefore(date);
      setMessage(
        res.success
          ? (res.message ?? "삭제되었습니다.")
          : (res.error ?? "오류가 발생했습니다."),
      );
      if (res.success) router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-1 text-xs font-bold text-slate-600">
          데이터 내보내기
        </h3>
        <p className="mb-3 text-xs font-light text-slate-500">
          Cloudflare 일별 집계 전체를 CSV로 내려받습니다.
        </p>
        <a
          href="/api/admin/traffic/export"
          download
          className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download size={16} />
          CSV 다운로드
        </a>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 text-xs font-bold text-slate-600">
          오래된 데이터 삭제
        </h3>
        <p className="mb-3 text-xs font-light text-slate-500">
          입력한 날짜 이전의 Cloudflare 집계 파일을 삭제해 공간을 확보합니다.
          {oldestDate && ` (가장 오래된 데이터: ${oldestDate})`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setConfirming(false);
            }}
            className="border border-slate-300 px-3 py-2 text-sm"
          />
          {!confirming ? (
            <button
              type="button"
              disabled={!date || pending}
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-2 border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={16} />
              이전 데이터 삭제
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600">
                {date} 이전 삭제?
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={runDelete}
                className="border border-red-500 bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {pending ? "삭제 중…" : "확인"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600"
              >
                취소
              </button>
            </div>
          )}
        </div>
        {message && (
          <p className="mt-2 text-xs font-bold text-slate-700">{message}</p>
        )}
      </Card>
    </div>
  );
}
