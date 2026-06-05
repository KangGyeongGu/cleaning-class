import type { QuoteFunnelRow } from "@/shared/lib/queries/dashboard";

interface Props {
  rows: QuoteFunnelRow[];
}

function percent(numer: number, denom: number): string {
  if (denom === 0) return "—";
  return `${((numer / denom) * 100).toFixed(1)}%`;
}

export function QuoteFunnelTable({ rows }: Props): React.ReactElement {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        견적 퍼널 (7일)
      </h2>
      <div className="overflow-x-auto border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">날짜</th>
              <th className="px-4 py-2 text-right font-medium">랜딩</th>
              <th className="px-4 py-2 text-right font-medium">클릭</th>
              <th className="px-4 py-2 text-right font-medium">성공</th>
              <th className="px-4 py-2 text-right font-medium">랜딩→클릭</th>
              <th className="px-4 py-2 text-right font-medium">클릭→성공</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.date}>
                <td className="px-4 py-2 text-slate-900">{r.date}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {r.landings}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {r.clicks}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {r.success}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                  {percent(r.clicks, r.landings)}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                  {percent(r.success, r.clicks)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
