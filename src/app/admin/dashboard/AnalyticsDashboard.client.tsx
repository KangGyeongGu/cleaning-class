"use client";

import { useState, useCallback } from "react";
import type { AnalyticsData } from "@/shared/lib/queries/analytics";
import {
  refreshAllAnalytics,
  refreshSummary,
  refreshDailyVisitors,
  refreshTrafficSources,
  refreshDevice,
  refreshTopPages,
  refreshRegion,
} from "@/shared/actions/analytics";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  initialData: AnalyticsData | null;
}

const SLATE = {
  900: "#0f172a",
  700: "#334155",
  500: "#64748b",
  400: "#94a3b8",
  300: "#cbd5e1",
  200: "#e2e8f0",
  100: "#f1f5f9",
  50: "#f8fafc",
} as const;

const CHART = {
  primary: "#2563eb", // blue-600 — 주요 지표 (방문자, 세션)
  secondary: "#7c3aed", // violet-600 — 보조 지표
  success: "#059669", // emerald-600 — 긍정 지표 (전환)
  warning: "#d97706", // amber-600 — 주의 지표
  accent: "#0891b2", // cyan-600 — 강조
  muted: "#94a3b8", // slate-400 — 비활성
  area: "#2563eb", // 영역 차트 기본색
  areaLight: "#dbeafe", // blue-100 — 영역 그라데이션
} as const;

const PIE_COLORS = [
  CHART.primary,
  CHART.secondary,
  CHART.warning,
  CHART.accent,
  SLATE[300],
];

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function shortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  }
  return dateStr;
}

function translateEventName(name: string): string {
  const map: Record<string, string> = {
    generate_lead: "견적 문의",
    phone_click: "전화 클릭",
    review_card_click: "리뷰 카드",
    sns_click: "SNS 클릭",
    faq_open: "FAQ 열기",
  };
  return map[name] ?? name;
}

function translateDevice(device: string): string {
  const map: Record<string, string> = {
    desktop: "데스크톱",
    mobile: "모바일",
    tablet: "태블릿",
  };
  return map[device.toLowerCase()] ?? device;
}

function translateChannel(channel: string): string {
  const map: Record<string, string> = {
    "Organic Search": "자연 검색",
    Direct: "직접 유입",
    "Organic Social": "소셜 미디어",
    Referral: "추천",
    "Paid Search": "유료 검색",
    Email: "이메일",
    Unassigned: "미분류",
  };
  return map[channel] ?? channel;
}

function formatRegionLabel(region: string, city: string): string {
  const r = region && region !== "(not set)" ? region : "";
  const c = city && city !== "(not set)" ? city : "";
  if (!r && !c) return "(미확인)";

  if (r === c) return r;
  if (!c) return r;
  if (!r) return c;
  return `${r} · ${c}`;
}

function HelpTip({ text }: { text: string }): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <button
      type="button"
      className="relative ml-1.5 inline-flex cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      aria-label="도움말"
    >
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-medium text-slate-400">
        ?
      </span>
      {show && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed font-normal text-slate-600 shadow-md"
        >
          {text}
        </span>
      )}
    </button>
  );
}

function SectionTitle({
  children,
  help,
  as: Tag = "h3",
  className = "text-sm font-bold text-slate-700",
}: {
  children: React.ReactNode;
  help: string;
  as?: "h2" | "h3";
  className?: string;
}): React.ReactElement {
  return (
    <Tag className={`mb-4 flex items-center ${className}`}>
      {children}
      <HelpTip text={help} />
    </Tag>
  );
}

function RefreshIcon({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  } catch {
    return "";
  }
}

function RefreshButton({
  onClick,
  loading,
  updatedAt,
}: {
  onClick: () => void;
  loading: boolean;
  updatedAt?: string;
}): React.ReactElement {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      {updatedAt && (
        <span className="text-xs text-slate-500 tabular-nums">
          {formatTime(updatedAt)}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center justify-center rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        title="새로고침"
      >
        <span className={loading ? "animate-spin" : ""}>
          <RefreshIcon size={15} />
        </span>
      </button>
    </div>
  );
}

function RefreshAllButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 disabled:opacity-50"
    >
      <span className={loading ? "animate-spin" : ""}>
        <RefreshIcon size={14} />
      </span>
      {loading ? "조회 중..." : "전체 새로고침"}
    </button>
  );
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((item) => (
        <p
          key={item.dataKey ?? item.name}
          className="text-sm font-bold text-slate-900"
        >
          {item.name}: {formatNumber(item.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

function NoDataFallback(): React.ReactElement {
  return (
    <section className="border border-slate-200 p-8 text-center">
      <p className="mb-2 text-lg font-bold text-slate-900">
        GA4 데이터를 불러올 수 없습니다
      </p>
      <p className="text-sm text-slate-500">
        GA4 연동이 설정되지 않았거나 데이터를 불러올 수 없습니다.
      </p>
      <p className="mt-2 text-sm text-slate-400">
        환경변수 GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY를 확인하세요.
      </p>
    </section>
  );
}

function KpiCard({
  label,
  value,
  unit,
  help,
}: {
  label: string;
  value: string;
  unit?: string;
  help?: string;
}): React.ReactElement {
  return (
    <div className="border border-slate-200 p-6">
      <p className="mb-3 flex items-center text-xs font-medium tracking-widest text-slate-500 uppercase">
        {label}
        {help && <HelpTip text={help} />}
      </p>
      <p className="text-3xl font-black text-slate-900">
        {value}
        {unit && (
          <span className="ml-1 text-lg font-medium text-slate-400">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <p className="py-8 text-center text-sm text-slate-400">
      데이터가 없습니다.
    </p>
  );
}

function DailyVisitorChart({
  data,
}: {
  data: AnalyticsData["dailyVisitors"];
}): React.ReactElement {
  if (data.length === 0) return <EmptyState />;

  const chartData = data.map((d) => ({
    date: shortDate(d.date),
    방문자: d.activeUsers,
    세션: d.sessions,
  }));

  const tickInterval = Math.max(Math.floor(chartData.length / 5) - 1, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="gradVisitor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.2} />
            <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={SLATE[100]} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: SLATE[400] }}
          axisLine={{ stroke: SLATE[200] }}
          tickLine={false}
          interval={tickInterval}
        />
        <YAxis
          tick={{ fontSize: 11, fill: SLATE[400] }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="방문자"
          stroke={CHART.primary}
          strokeWidth={2}
          fill="url(#gradVisitor)"
        />
        <Area
          type="monotone"
          dataKey="세션"
          stroke={CHART.secondary}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrafficSourceChart({
  data,
}: {
  data: AnalyticsData["trafficSources"];
}): React.ReactElement {
  if (data.length === 0) return <EmptyState />;

  const chartData = data
    .map((s) => ({
      name: translateChannel(s.channel),
      세션: s.sessions,
    }))
    .slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={SLATE[100]}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: SLATE[400] }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: SLATE[500] }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="세션" fill={CHART.primary} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function DeviceSection({
  breakdown,
  detail,
}: {
  breakdown: AnalyticsData["deviceBreakdown"];
  detail: AnalyticsData["deviceDetail"];
}): React.ReactElement {
  if (breakdown.length === 0) return <EmptyState />;

  const total = breakdown.reduce((sum, d) => sum + d.users, 0);
  const chartData = breakdown.map((d) => ({
    name: translateDevice(d.device),
    value: d.users,
    pct: total > 0 ? Math.round((d.users / total) * 100) : 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => formatNumber(Number(value ?? 0))}
              contentStyle={{
                border: `1px solid ${SLATE[200]}`,
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="space-y-2 text-sm">
          {chartData.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-slate-600">{d.name}</span>
              <span className="ml-auto font-bold text-slate-900">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>

      {detail.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-left text-xs font-medium tracking-wider text-slate-400 uppercase">
                  디바이스
                </th>
                <th className="pb-2 text-right text-xs font-medium tracking-wider text-slate-400 uppercase">
                  세션
                </th>
                <th className="pb-2 text-right text-xs font-medium tracking-wider text-slate-400 uppercase">
                  이탈률
                </th>
                <th className="pb-2 text-right text-xs font-medium tracking-wider text-slate-400 uppercase">
                  평균 체류
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {detail.map((d) => (
                <tr key={d.device}>
                  <td className="py-2 text-slate-700">
                    {translateDevice(d.device)}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatNumber(d.sessions)}
                  </td>
                  <td className="py-2 text-right text-slate-600">
                    {(d.bounceRate * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-slate-600">
                    {formatDuration(d.avgSessionDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BrowserChart({
  data,
}: {
  data: AnalyticsData["browserBreakdown"];
}): React.ReactElement {
  if (data.length === 0) return <EmptyState />;

  const chartData = data.slice(0, 6).map((b) => ({
    name: b.browser,
    사용자: b.users,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={SLATE[100]}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: SLATE[400] }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: SLATE[500] }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="사용자" fill={CHART.accent} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ConversionChart({
  data,
}: {
  data: AnalyticsData["conversionEvents"];
}): React.ReactElement {
  if (data.length === 0) return <EmptyState />;

  const chartData = data.map((e) => ({
    name: translateEventName(e.eventName),
    횟수: e.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 120)}>
      <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={SLATE[100]}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: SLATE[400] }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: SLATE[500] }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="횟수" fill={CHART.success} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsDashboard({
  initialData,
}: Props): React.ReactElement {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, string>>(() => {
    const ts = initialData?.lastUpdated ?? "";
    return {
      all: ts,
      summary: ts,
      daily: ts,
      traffic: ts,
      device: ts,
      pages: ts,
      region: ts,
    };
  });

  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T | null> => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        return await fn();
      } catch {
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [],
  );

  const markUpdated = useCallback((...keys: string[]): void => {
    const ts = new Date().toISOString();
    setUpdatedAt((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = ts;
      return next;
    });
  }, []);

  const handleRefreshAll = useCallback(async (): Promise<void> => {
    const result = await withLoading("all", refreshAllAnalytics);
    if (result) {
      setData(result);
      markUpdated(
        "all",
        "summary",
        "daily",
        "traffic",
        "device",
        "pages",
        "region",
      );
    }
  }, [withLoading, markUpdated]);

  const handleRefreshSummary = useCallback(async (): Promise<void> => {
    const result = await withLoading("summary", refreshSummary);
    if (!result) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            summary: result.summary,
            conversionEvents: result.conversionEvents,
            lastUpdated: result.lastUpdated,
          }
        : null,
    );
    markUpdated("summary");
  }, [withLoading, markUpdated]);

  const handleRefreshDaily = useCallback(async (): Promise<void> => {
    const result = await withLoading("daily", refreshDailyVisitors);
    if (!result) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            dailyVisitors: result,
            lastUpdated: new Date().toISOString(),
          }
        : null,
    );
    markUpdated("daily");
  }, [withLoading, markUpdated]);

  const handleRefreshTraffic = useCallback(async (): Promise<void> => {
    const result = await withLoading("traffic", refreshTrafficSources);
    if (!result) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            trafficSources: result,
            lastUpdated: new Date().toISOString(),
          }
        : null,
    );
    markUpdated("traffic");
  }, [withLoading, markUpdated]);

  const handleRefreshDevice = useCallback(async (): Promise<void> => {
    const result = await withLoading("device", refreshDevice);
    if (!result) return;
    setData((prev) =>
      prev
        ? { ...prev, ...result, lastUpdated: new Date().toISOString() }
        : null,
    );
    markUpdated("device");
  }, [withLoading, markUpdated]);

  const handleRefreshPages = useCallback(async (): Promise<void> => {
    const result = await withLoading("pages", refreshTopPages);
    if (!result) return;
    setData((prev) =>
      prev
        ? { ...prev, topPages: result, lastUpdated: new Date().toISOString() }
        : null,
    );
    markUpdated("pages");
  }, [withLoading, markUpdated]);

  const handleRefreshRegion = useCallback(async (): Promise<void> => {
    const result = await withLoading("region", refreshRegion);
    if (!result) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            regionBreakdown: result,
            lastUpdated: new Date().toISOString(),
          }
        : null,
    );
    markUpdated("region");
  }, [withLoading, markUpdated]);

  if (!data) {
    return <NoDataFallback />;
  }

  const totalConversions = data.conversionEvents.reduce(
    (sum, e) => sum + e.count,
    0,
  );
  const conversionRate =
    data.summary.sessions > 0
      ? ((totalConversions / data.summary.sessions) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">대시보드</h1>
        <RefreshAllButton onClick={handleRefreshAll} loading={!!loading.all} />
      </div>

      <section>
        <div className="mb-4 flex items-center">
          <SectionTitle
            as="h2"
            className="text-lg font-bold text-slate-900"
            help="최근 30일간의 주요 웹사이트 성과 지표입니다. GA4 데이터 특성상 24~48시간 지연이 있을 수 있습니다."
          >
            핵심 지표 (최근 30일)
          </SectionTitle>
          <RefreshButton
            onClick={handleRefreshSummary}
            loading={!!loading.summary}
            updatedAt={updatedAt.summary}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="방문자 수"
            value={formatNumber(data.summary.activeUsers)}
            unit="명"
            help="최근 30일간 사이트를 방문한 고유 사용자 수입니다."
          />
          <KpiCard
            label="세션 수"
            value={formatNumber(data.summary.sessions)}
            unit="회"
            help="방문자의 총 접속 횟수입니다. 한 사용자가 여러 번 방문하면 세션이 여러 개로 집계됩니다."
          />
          <KpiCard
            label="전환 이벤트"
            value={formatNumber(totalConversions)}
            unit="건"
            help="견적 문의, 전화 클릭, 리뷰 조회, SNS 클릭 등 사이트에서 발생한 주요 상호작용 총 횟수입니다."
          />
          <KpiCard
            label="전환율"
            value={conversionRate}
            unit="%"
            help="전체 세션 중 전환 이벤트가 발생한 비율입니다. 높을수록 방문자가 적극적으로 상호작용하고 있다는 의미입니다."
          />
        </div>
      </section>

      <section>
        <div className="border border-slate-200 p-6">
          <div className="mb-4 flex items-center">
            <SectionTitle help="최근 30일간 일별 방문자 수와 세션 수 추이입니다. 실선은 방문자, 점선은 세션입니다.">
              일별 방문자 추이
            </SectionTitle>
            <RefreshButton
              onClick={handleRefreshDaily}
              loading={!!loading.daily}
              updatedAt={updatedAt.daily}
            />
          </div>
          <DailyVisitorChart data={data.dailyVisitors} />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border border-slate-200 p-6">
            <div className="mb-4 flex items-center">
              <SectionTitle help="방문자가 어떤 경로로 사이트에 유입되었는지 보여줍니다. 자연 검색(구글/네이버), 직접 유입(URL 직접 입력), 소셜 미디어 등으로 구분됩니다.">
                유입 경로
              </SectionTitle>
              <RefreshButton
                onClick={handleRefreshTraffic}
                loading={!!loading.traffic}
                updatedAt={updatedAt.traffic}
              />
            </div>
            <TrafficSourceChart data={data.trafficSources} />
          </div>

          <div className="border border-slate-200 p-6">
            <div className="mb-4 flex items-center">
              <SectionTitle help="방문자가 사용한 기기 유형별 비율과 세션 수, 이탈률, 평균 체류 시간을 보여줍니다. 이탈률이 낮고 체류 시간이 길수록 좋습니다.">
                디바이스 분류
              </SectionTitle>
              <RefreshButton
                onClick={handleRefreshDevice}
                loading={!!loading.device}
                updatedAt={updatedAt.device}
              />
            </div>
            <DeviceSection
              breakdown={data.deviceBreakdown}
              detail={data.deviceDetail}
            />
          </div>

          <div className="border border-slate-200 p-6">
            <div className="mb-4 flex items-center">
              <SectionTitle help="방문자가 사용한 웹 브라우저별 사용자 수입니다. Chrome, Safari, Samsung Internet 등으로 구분됩니다.">
                브라우저 분포
              </SectionTitle>
              <RefreshButton
                onClick={handleRefreshDevice}
                loading={!!loading.device}
                updatedAt={updatedAt.device}
              />
            </div>
            <BrowserChart data={data.browserBreakdown} />
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border border-slate-200 p-6">
            <div className="mb-4 flex items-center">
              <SectionTitle help="방문자가 가장 많이 조회한 페이지 순위입니다. 어떤 페이지가 관심을 끄는지 파악할 수 있습니다.">
                인기 페이지
              </SectionTitle>
              <RefreshButton
                onClick={handleRefreshPages}
                loading={!!loading.pages}
                updatedAt={updatedAt.pages}
              />
            </div>
            {data.topPages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2.5 text-left text-xs font-medium tracking-wider text-slate-400 uppercase">
                        경로
                      </th>
                      <th className="pb-2.5 text-right text-xs font-medium tracking-wider text-slate-400 uppercase">
                        조회수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.topPages.map((page, i) => (
                      <tr key={page.path}>
                        <td className="py-2.5 text-slate-600">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                            {i + 1}
                          </span>
                          <span className="text-xs">{page.path}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatNumber(page.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          <div className="border border-slate-200 p-6">
            <div className="mb-4 flex items-center">
              <SectionTitle help="국내 방문자의 접속 지역(시/도·도시)별 분포입니다. 해외 트래픽은 제외됩니다.">
                지역별 방문자
              </SectionTitle>
              <RefreshButton
                onClick={handleRefreshRegion}
                loading={!!loading.region}
                updatedAt={updatedAt.region}
              />
            </div>
            {data.regionBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2.5 text-left text-xs font-medium tracking-wider text-slate-400 uppercase">
                        지역
                      </th>
                      <th className="pb-2.5 text-right text-xs font-medium tracking-wider text-slate-400 uppercase">
                        방문자
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.regionBreakdown.map((r, i) => (
                      <tr key={`${r.region}-${r.city}-${i}`}>
                        <td className="py-2.5 text-slate-600">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                            {i + 1}
                          </span>
                          {formatRegionLabel(r.region, r.city)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatNumber(r.users)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center">
          <SectionTitle
            as="h2"
            className="text-lg font-bold text-slate-900"
            help="사이트에서 발생한 주요 상호작용 이벤트입니다. 견적 문의 제출, 전화번호 클릭, 리뷰 카드 클릭, SNS 링크 클릭, FAQ 열기 등이 포함됩니다."
          >
            전환 이벤트 상세
          </SectionTitle>
          <RefreshButton
            onClick={handleRefreshSummary}
            loading={!!loading.summary}
            updatedAt={updatedAt.summary}
          />
        </div>
        <div className="border border-slate-200 p-6">
          <ConversionChart data={data.conversionEvents} />
        </div>
      </section>
    </div>
  );
}
