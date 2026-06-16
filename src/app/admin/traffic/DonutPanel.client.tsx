"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Row {
  label: string;
  value: number;
}

interface Props {
  title: string;
  rows: Row[];
  limit?: number;
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#64748b",
];

export function DonutPanel({
  title,
  rows,
  limit = 8,
}: Props): React.ReactElement {
  const data = rows.slice(0, limit);
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="border border-slate-200 bg-white">
      <h3 className="border-b border-slate-200 px-5 py-3 text-xs font-bold tracking-widest text-slate-500 uppercase">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">데이터 없음</p>
      ) : (
        <>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={208}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={1}
                  stroke="none"
                >
                  {data.map((row, i) => (
                    <Cell key={row.label} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 0,
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">항목</th>
                  <th className="px-3 py-2 text-right font-medium">값</th>
                  <th className="px-5 py-2 text-right font-medium">비율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={row.label}>
                    <td className="px-5 py-2">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        {row.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                      {row.value.toLocaleString()}
                    </td>
                    <td className="px-5 py-2 text-right text-slate-400 tabular-nums">
                      {total === 0
                        ? "—"
                        : `${((row.value / total) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
