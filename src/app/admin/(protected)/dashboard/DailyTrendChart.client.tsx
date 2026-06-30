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
import type { DailyTrendRow } from "@/shared/lib/queries/dashboard";
import { Card } from "@/components/ui/Card";
import { formatMonthDay } from "@/shared/lib/pure/format";

interface Props {
  rows: DailyTrendRow[];
}

interface ChartDatum {
  date: string;
  label: string;
  방문자: number;
  "청소 견적": number;
  "이사 견적": number;
  "청소 전화": number;
  "이사 전화": number;
}

const SERIES: Array<{
  key: keyof Omit<ChartDatum, "date" | "label">;
  stroke: string;
  dash?: string;
}> = [
  { key: "방문자", stroke: "#0f172a" },
  { key: "청소 견적", stroke: "#2563eb" },
  { key: "이사 견적", stroke: "#2563eb", dash: "4 4" },
  { key: "청소 전화", stroke: "#16a34a" },
  { key: "이사 전화", stroke: "#16a34a", dash: "4 4" },
];

export function DailyTrendChart({ rows }: Props): React.ReactElement {
  const data: ChartDatum[] = rows.map((r) => ({
    date: r.date,
    label: formatMonthDay(r.date),
    방문자: r.visitors,
    "청소 견적": r.quoteCleaning,
    "이사 견적": r.quoteMoving,
    "청소 전화": r.phoneCleaning,
    "이사 전화": r.phoneMoving,
  }));

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-bold tracking-widest text-slate-500 uppercase">
        일자별 추이 (최근 7일)
      </h2>
      <Card className="p-4 md:p-6">
        <div className="h-72 w-full md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 0,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 700 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="plainline"
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.stroke}
                  strokeWidth={2}
                  strokeDasharray={s.dash}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}
