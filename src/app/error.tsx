"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-6xl font-black text-slate-900">ERROR</h1>
        <p className="mb-8 text-lg font-light text-slate-600">
          문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="mb-8 font-mono text-sm text-slate-400">
            {error.message}
          </p>
        )}
        <Button onClick={reset} size="none" className="px-8 py-3">
          다시 시도
        </Button>
      </div>
    </main>
  );
}
