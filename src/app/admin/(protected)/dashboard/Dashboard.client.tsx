"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { DashboardDateRange } from "@/app/admin/(protected)/dashboard/DashboardDateRange.client";
import { DashboardChart } from "@/app/admin/(protected)/dashboard/DashboardChart.client";
import {
  dashboardSnapshotSchema,
  dashboardTotals,
  kstDate,
} from "@/shared/lib/pure/dashboard";
import {
  DASHBOARD_PERIODS,
  DASHBOARD_REFRESH_MS,
  offsetDate,
} from "@/shared/lib/pure/analytics";
import type { DashboardSnapshot } from "@/shared/lib/pure/dashboard";

interface Props {
  ga4ConsoleUrl?: string;
  clarityConsoleUrl?: string;
  initial: DashboardSnapshot | null;
  initialError: string | null;
  range: { start: string; end: string; today: string; earliest: string };
}

export function Dashboard({
  initial,
  initialError,
  range,
  ga4ConsoleUrl,
  clarityConsoleUrl,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [serverState, setServerState] = useState({ initial, initialError });
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [today, setToday] = useState(range.today);
  const earliest = range.earliest;
  const refreshRef = useRef<() => void>(() => {});

  if (
    serverState.initial !== initial ||
    serverState.initialError !== initialError
  ) {
    setServerState({ initial, initialError });
    if (initial) setSnapshot(initial);
    setError(initialError);
  }

  useEffect(() => {
    let active = true;
    let busy = false;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      controller = new AbortController();
      setPending(true);
      try {
        const response = await fetch(
          `/api/admin/dashboard?start=${range.start}&end=${range.end}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "로그인이 만료되었습니다. 다시 로그인해주세요."
              : "통계를 갱신하지 못했습니다. 잠시 후 다시 시도해주세요.",
          );
        const body: unknown = await response.json();
        const result = dashboardSnapshotSchema.parse(body);
        if (active) {
          setSnapshot(result);
          setError(null);
        }
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "통계를 갱신하지 못했습니다.",
          );
      } finally {
        busy = false;
        if (active) setPending(false);
      }
    };
    refreshRef.current = () => {
      void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const nextToday = kstDate();
      setToday(nextToday);
      if (nextToday !== range.today) {
        router.refresh();
        return;
      }
      void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setToday(kstDate());
      if (document.visibilityState === "visible" && range.end === kstDate())
        void refresh();
      if (kstDate() !== range.today && document.visibilityState === "visible")
        router.refresh();
    }, DASHBOARD_REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [range.start, range.end, range.today, router]);

  const apply = (from: string, to: string) => {
    if (!from || !to || from < earliest || to > today || from > to) {
      setError("최근 6개월 이내의 올바른 조회 기간을 선택해주세요.");
      return;
    }
    router.push(`${pathname}?start=${from}&end=${to}`, { scroll: false });
  };
  const rows = snapshot?.rows ?? [];
  const totals = dashboardTotals(rows);
  const number = (value: number) => value.toLocaleString("ko-KR");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
            대시보드
          </h1>
        </div>
      </header>
      <nav aria-label="분석 바로가기" className="mb-6 flex flex-wrap gap-4">
        <Link
          href="/admin/traffic"
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          트래픽 분석
        </Link>
        {ga4ConsoleUrl && (
          <a
            href={ga4ConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            GA4 콘솔
          </a>
        )}
        {clarityConsoleUrl && (
          <a
            href={clarityConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            Clarity 콘솔
          </a>
        )}
      </nav>
      <div className="mb-6 flex flex-wrap items-center gap-3 md:gap-5">
        <nav
          aria-label="조회 기간"
          className="inline-flex h-9 shrink-0 items-center border border-slate-200 bg-slate-50 p-0.5"
        >
          {DASHBOARD_PERIODS.map((days) => {
            const from = offsetDate(today, 1 - days);
            const selected = range.start === from && range.end === today;
            return (
              <button
                key={days}
                type="button"
                aria-pressed={selected}
                onClick={() => apply(from, today)}
                className={`h-7 px-4 text-xs font-bold transition-colors ${selected ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                {days}일
              </button>
            );
          })}
        </nav>
        <DashboardDateRange
          start={range.start}
          end={range.end}
          earliest={earliest}
          today={today}
          onApply={apply}
        />
        <Button
          variant="outline"
          size="none"
          className="ml-auto h-9 px-3 text-xs"
          loading={pending}
          onClick={() => refreshRef.current()}
        >
          <RefreshCw size={14} />
          새로고침
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          {snapshot && " 이전에 조회한 값을 유지하고 있습니다."}
        </div>
      )}
      {snapshot && (
        <div aria-busy={pending}>
          <Card className="mb-6 min-w-0 p-4 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                방문 및 문의 추이
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {range.start} — {range.end}
              </span>
            </div>
            <DashboardChart rows={rows} />
            <div className="mt-6 overflow-x-auto">
              <Table aria-label="선택 기간 고객 활동 합계">
                <Thead>
                  <Tr>
                    <Th className="w-1/3">서비스</Th>
                    <Th className="w-1/3 text-right">견적</Th>
                    <Th className="w-1/3 text-right">전화</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    {
                      label: "청소",
                      phone: totals.phoneCleaning,
                      quote: totals.quoteCleaning,
                    },
                    {
                      label: "이사",
                      phone: totals.phoneMoving,
                      quote: totals.quoteMoving,
                    },
                    {
                      label: "합계",
                      phone: totals.phoneCleaning + totals.phoneMoving,
                      quote: totals.quoteCleaning + totals.quoteMoving,
                    },
                  ].map((row) => (
                    <Tr
                      key={row.label}
                      className={
                        row.label === "합계"
                          ? "border-t border-slate-200 bg-slate-50 font-bold"
                          : ""
                      }
                    >
                      <Td>{row.label}</Td>
                      <Td className="text-right tabular-nums">
                        {number(row.quote)}건
                      </Td>
                      <Td className="text-right tabular-nums">
                        {number(row.phone)}건
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
