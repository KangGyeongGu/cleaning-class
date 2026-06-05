import type { TrafficSourceRow } from "@/shared/lib/queries/dashboard";

interface Props {
  rows: TrafficSourceRow[];
}

const LABELS: Record<string, string> = {
  google: "Google",
  naver: "네이버",
  daum: "다음/카카오",
  bing: "Bing",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  gemini: "Gemini",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  daangn: "당근",
  direct: "직접 유입",
  referral: "기타 referral",
};

export function TrafficSourceTable({ rows }: Props): React.ReactElement {
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        유입 채널 (30일)
      </h2>
      <div className="overflow-x-auto border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">채널</th>
              <th className="px-4 py-2 text-right font-medium">랜딩</th>
              <th className="px-4 py-2 text-right font-medium">비율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.source}>
                <td className="px-4 py-2 text-slate-900">
                  {LABELS[r.source] ?? r.source}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                  {total === 0
                    ? "—"
                    : `${((r.count / total) * 100).toFixed(1)}%`}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
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
