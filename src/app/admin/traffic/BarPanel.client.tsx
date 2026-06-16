"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GaPanelMeta } from "@/shared/lib/schema/traffic";

export interface BarRow {
  label: string;
  hits: number;
  visitors?: number;
  bytes?: number;
  hitsPct?: string;
  visitorsPct?: string;
  method?: string;
  protocol?: string;
}

interface Props {
  title: string;
  dataLabel: string;
  rows: BarRow[];
  meta?: GaPanelMeta;
  chartLimit?: number;
  showVisitors?: boolean;
  showBytes?: boolean;
  showMethodProtocol?: boolean;
}

function fmtBytes(n?: number): string {
  const b = n ?? 0;
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`;
  return `${b} B`;
}

type MetaVal = { value: number; percent?: string } | undefined;

function metaNum(v: MetaVal): string {
  if (!v) return "—";
  return v.percent
    ? `${v.value.toLocaleString()} (${v.percent}%)`
    : v.value.toLocaleString();
}

function metaBytes(v: MetaVal): string {
  if (!v) return "—";
  return v.percent ? `${fmtBytes(v.value)} (${v.percent}%)` : fmtBytes(v.value);
}

function clip(s: string): string {
  return s.length > 20 ? `…${s.slice(-20)}` : s;
}

export function BarPanel({
  title,
  dataLabel,
  rows,
  meta,
  chartLimit = 8,
  showVisitors = true,
  showBytes = true,
  showMethodProtocol = false,
}: Props): React.ReactElement {
  const chartData = rows
    .slice(0, chartLimit)
    .map((r) => ({ label: r.label, Hits: r.hits, Visitors: r.visitors ?? 0 }));

  const hasMeta = Boolean(meta?.hits || meta?.visitors || meta?.bytes);

  const summaryRow = (label: string, key: "min" | "max" | "avg") => (
    <tr className="bg-slate-50 text-xs text-slate-400">
      <td className="px-4 py-1.5 font-bold">{label}</td>
      <td className="px-3 py-1.5 text-right tabular-nums">
        {metaNum(meta?.hits?.[key])}
      </td>
      {showVisitors && (
        <td className="px-3 py-1.5 text-right tabular-nums">
          {metaNum(meta?.visitors?.[key])}
        </td>
      )}
      {showBytes && (
        <td className="px-3 py-1.5 text-right tabular-nums">
          {metaBytes(meta?.bytes?.[key])}
        </td>
      )}
      {showMethodProtocol && (
        <>
          <td className="px-3 py-1.5">—</td>
          <td className="px-3 py-1.5">—</td>
        </>
      )}
      <td className="px-4 py-1.5">—</td>
    </tr>
  );

  return (
    <div className="border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-5 py-3 text-xs font-bold tracking-widest text-slate-500 uppercase">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">데이터 없음</p>
      ) : (
        <>
          <div className="h-72 w-full px-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={150}
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={clip}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 0,
                    border: "1px solid #e2e8f0",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="Hits" fill="#2563eb" radius={[0, 2, 2, 0]} />
                {showVisitors && (
                  <Bar
                    dataKey="Visitors"
                    fill="#16a34a"
                    radius={[0, 2, 2, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-right font-medium">Hits</th>
                  {showVisitors && (
                    <th className="px-3 py-2 text-right font-medium">
                      Visitors
                    </th>
                  )}
                  {showBytes && (
                    <th className="px-3 py-2 text-right font-medium">Tx</th>
                  )}
                  {showMethodProtocol && (
                    <>
                      <th className="px-3 py-2 text-left font-medium">
                        Method
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Proto</th>
                    </>
                  )}
                  <th className="px-4 py-2 text-left font-medium">
                    {dataLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasMeta && (
                  <>
                    {summaryRow("min", "min")}
                    {summaryRow("max", "max")}
                    {summaryRow("avg", "avg")}
                  </>
                )}
                {rows.map((r, i) => (
                  <tr key={`${r.label}-${i}`}>
                    <td className="px-4 py-2 text-slate-400 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="font-bold text-slate-900">
                        {r.hits.toLocaleString()}
                      </span>
                      {r.hitsPct && (
                        <span className="ml-1 text-xs text-slate-400">
                          {r.hitsPct}%
                        </span>
                      )}
                    </td>
                    {showVisitors && (
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className="font-bold text-slate-900">
                          {(r.visitors ?? 0).toLocaleString()}
                        </span>
                        {r.visitorsPct && (
                          <span className="ml-1 text-xs text-slate-400">
                            {r.visitorsPct}%
                          </span>
                        )}
                      </td>
                    )}
                    {showBytes && (
                      <td className="px-3 py-2 text-right text-slate-500 tabular-nums">
                        {fmtBytes(r.bytes)}
                      </td>
                    )}
                    {showMethodProtocol && (
                      <>
                        <td className="px-3 py-2 text-slate-500">
                          {r.method ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {r.protocol ?? "—"}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 break-all text-slate-700">
                      {r.label}
                    </td>
                  </tr>
                ))}
              </tbody>
              {hasMeta && (
                <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <td className="px-4 py-2">tot</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {(meta?.hits?.total?.value ?? 0).toLocaleString()}
                    </td>
                    {showVisitors && (
                      <td className="px-3 py-2 text-right tabular-nums">
                        {(meta?.visitors?.total?.value ?? 0).toLocaleString()}
                      </td>
                    )}
                    {showBytes && (
                      <td className="px-3 py-2 text-right tabular-nums">
                        {fmtBytes(meta?.bytes?.total?.value)}
                      </td>
                    )}
                    <td colSpan={showMethodProtocol ? 3 : 1} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
