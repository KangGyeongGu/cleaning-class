"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardRow } from "@/shared/lib/pure/dashboard";

const SERIES = [
  { key: "visitors", name: "방문자", color: "#0f172a", dash: undefined },
  {
    key: "quoteCleaning",
    name: "청소 견적",
    color: "#2563eb",
    dash: undefined,
  },
  { key: "quoteMoving", name: "이사 견적", color: "#2563eb", dash: "4 4" },
  {
    key: "phoneCleaning",
    name: "청소 전화",
    color: "#16a34a",
    dash: undefined,
  },
  { key: "phoneMoving", name: "이사 전화", color: "#16a34a", dash: "4 4" },
] as const;

export function DashboardChart({ rows }: { rows: DashboardRow[] }) {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const data = rows.map((row) => ({
    ...row,
    label: row.date.slice(5).replace("-", "/"),
  }));
  return (
    <div
      ref={container}
      className="w-full min-w-0"
      aria-label="날짜별 방문자·전화·견적 추이"
    >
      {width > 0 ? (
        <LineChart
          width={width}
          height={336}
          data={data}
          margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis allowDecimals={false} width={36} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 0,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
            }}
            labelStyle={{ color: "#0f172a", fontWeight: 700 }}
            filterNull={false}
            formatter={(value, name) => [value == null ? "—" : value, name]}
            labelFormatter={(_, payload) => payload[0]?.payload.date ?? ""}
          />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              hide={hidden.has(series.key)}
              name={series.name}
              dataKey={series.key}
              type="monotone"
              strokeWidth={2}
              activeDot={{ r: 5 }}
              stroke={series.color}
              strokeDasharray={series.dash}
              dot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <div
          className="h-84 animate-pulse bg-slate-50"
          aria-label="그래프 크기 확인 중"
        />
      )}
      <div
        className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-3"
        aria-label="차트 표시 항목"
      >
        {SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            aria-pressed={!hidden.has(series.key)}
            onClick={() =>
              setHidden((current) => {
                const next = new Set(current);
                if (next.has(series.key)) next.delete(series.key);
                else next.add(series.key);
                return next;
              })
            }
            className={`inline-flex items-center gap-2 text-xs transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-500 ${hidden.has(series.key) ? "text-slate-400 opacity-50" : "text-slate-600"}`}
          >
            <svg width="20" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                stroke={series.color}
                strokeWidth="2"
                strokeDasharray={series.dash}
              />
            </svg>
            {series.name}
          </button>
        ))}
      </div>
    </div>
  );
}
