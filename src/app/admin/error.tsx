"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] 페이지 오류:", error);
  }, [error]);

  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-slate-900">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-slate-500">
          {process.env.NODE_ENV === "development" && error.message
            ? error.message
            : "페이지를 불러오는 중 문제가 발생했습니다."}
        </p>
      </div>
      <Button onClick={reset} size="md">
        다시 시도
      </Button>
    </div>
  );
}
