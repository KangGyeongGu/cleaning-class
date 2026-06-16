"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SeriesRow {
  date: string;
  requests: number;
  pageViews: number;
  threats: number;
  uniques: number;
}

interface Props {
  rows: SeriesRow[];
}

function formatLabel(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}

export function TrafficTrendChart({ rows }: Props): React.ReactElement {
  const data = rows.map((r) => ({
    label: formatLabel(r.date),
    요청: r.requests,
    방문자: r.uniques,
    위협: r.threats,
  }));

  const tableRows = [...rows].reverse();

  return (
    <div className="border border-slate-200 bg-white">
      <div className="h-64 w-full p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              tickLine={false}
              allowDecimals={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 0,
                border: "1px solid #e2e8f0",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 700 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="요청"
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="방문자"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="위협"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-2 text-left font-medium">날짜</th>
              <th className="px-3 py-2 text-right font-medium">요청</th>
              <th className="px-3 py-2 text-right font-medium">페이지뷰</th>
              <th className="px-3 py-2 text-right font-medium">방문자</th>
              <th className="px-5 py-2 text-right font-medium">위협</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableRows.map((r) => (
              <tr key={r.date}>
                <td className="px-5 py-2 text-slate-700 tabular-nums">
                  {r.date}
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                  {r.requests.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.pageViews.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.uniques.toLocaleString()}
                </td>
                <td className="px-5 py-2 text-right tabular-nums">
                  {r.threats.toLocaleString()}
                </td>
              </tr>
            ))}
            {tableRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-6 text-center text-slate-400"
                >
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
