import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { StatCards } from "@/app/admin/(protected)/traffic/StatCards";
import { TrafficTrendChart } from "@/app/admin/(protected)/traffic/TrafficTrendChart.client";
import {
  BarPanel,
  type BarRow,
} from "@/app/admin/(protected)/traffic/BarPanel.client";
import { DonutPanel } from "@/app/admin/(protected)/traffic/DonutPanel.client";
import { DataControls } from "@/app/admin/(protected)/traffic/DataControls.client";
import {
  getCloudflareDays,
  getGoAccessReport,
  aggregateCloudflare,
  filterDaysByRange,
  gaPanel,
  gaMeta,
} from "@/shared/lib/queries/traffic";
import type { CloudflareDay, GaPanelItem } from "@/shared/lib/schema/traffic";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "트래픽 분석" };
export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7", label: "7일", days: 7 },
  { key: "30", label: "30일", days: 30 },
  { key: "all", label: "전체", days: null },
] as const;

const sectionTitle = "mb-3 text-label text-slate-500";

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
}

function pct(part: number, whole: number): string {
  return whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`;
}

function cfBar(rows: { label: string; value: number }[]): BarRow[] {
  return rows.map((r) => ({ label: r.label, hits: r.value }));
}

function gaBar(items: GaPanelItem[]): BarRow[] {
  return items.map((it) => ({
    label: it.data ?? "",
    hits: it.hits?.count ?? 0,
    visitors: it.visitors?.count ?? 0,
    bytes: it.bytes?.count,
    hitsPct: it.hits?.percent,
    visitorsPct: it.visitors?.percent,
    method: it.method,
    protocol: it.protocol,
  }));
}

function threatsByCountry(
  days: CloudflareDay[],
): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    for (const country of day.sum.countryMap) {
      if (country.threats > 0) {
        counts.set(
          country.clientCountryName,
          (counts.get(country.clientCountryName) ?? 0) + country.threats,
        );
      }
    }
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function TrafficPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const activeKey = RANGES.find((r) => r.key === params.days)?.key ?? "30";
  const rangeDays = RANGES.find((r) => r.key === activeKey)?.days ?? 30;

  const [allDays, goAccess] = await Promise.all([
    getCloudflareDays(),
    getGoAccessReport(),
  ]);

  const days = filterDaysByRange(allDays, rangeDays);
  const cf = aggregateCloudflare(days);
  const threatCountries = threatsByCountry(days);

  const serverErrors = cf.statuses
    .filter((s) => s.label.startsWith("5"))
    .reduce((sum, s) => sum + s.value, 0);

  const cards = [
    {
      label: "방문자",
      value: cf.totals.uniques.toLocaleString(),
      breakdown: "일별 합산",
    },
    { label: "총 요청", value: cf.totals.requests.toLocaleString() },
    { label: "페이지뷰", value: cf.totals.pageViews.toLocaleString() },
    { label: "위협 차단", value: cf.totals.threats.toLocaleString() },
    {
      label: "서버 에러",
      value: serverErrors.toLocaleString(),
      breakdown: "5xx",
    },
    { label: "대역폭", value: formatBytes(cf.totals.bytes) },
    {
      label: "캐시 적중률",
      value: pct(cf.totals.cachedRequests, cf.totals.requests),
    },
  ];

  return (
    <div className="px-4 py-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 md:text-2xl">
            트래픽 분석
          </h1>
          <p className="mt-1 text-xs font-light text-slate-500">
            Cloudflare 엣지 · GoAccess 오리진 — 핵심 지표
          </p>
        </div>
        <Card className="inline-flex p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/traffic?days=${r.key}`}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                r.key === activeKey
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </Card>
      </div>

      <section className="mb-10">
        <h2 className={sectionTitle}>개요</h2>
        <StatCards cards={cards} />
      </section>

      <section className="mb-10">
        <h2 className={sectionTitle}>일자별 추이</h2>
        <TrafficTrendChart rows={cf.series} />
      </section>

      <section className="mb-10">
        <h2 className={sectionTitle}>인기 페이지</h2>
        <BarPanel
          title="요청이 많은 URL"
          dataLabel="경로"
          rows={gaBar(gaPanel(goAccess, "requests", 15))}
          meta={gaMeta(goAccess, "requests")}
          showMethodProtocol
        />
      </section>

      <section className="mb-10">
        <h2 className={sectionTitle}>상태 · 보안</h2>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <DonutPanel title="상태코드 분포" rows={cf.statuses} />
          <BarPanel
            title="국가별 위협 (차단 출처)"
            dataLabel="국가"
            rows={cfBar(threatCountries)}
            showVisitors={false}
            showBytes={false}
          />
        </div>
      </section>

      <section className="mb-4">
        <h2 className={sectionTitle}>데이터 · 원본</h2>
        <Card className="mb-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-600">
                상세 통계 (GoAccess 전체 보고서)
              </h3>
              <p className="mt-1 text-xs font-light text-slate-500">
                국가·브라우저·OS·시간대·404·정적파일 등 전체 패널은 원본
                보고서에서 확인하세요.
              </p>
            </div>
            <a
              href="/api/admin/traffic/goaccess-report"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ExternalLink size={14} />
              전체 보고서 열기
            </a>
          </div>
        </Card>
        <DataControls oldestDate={allDays[0]?.dimensions.date ?? null} />
      </section>
    </div>
  );
}
