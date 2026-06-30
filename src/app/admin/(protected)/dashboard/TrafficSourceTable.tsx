import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr } from "@/components/ui/Table";
import { formatPercent } from "@/shared/lib/pure/format";
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
    <Card className="overflow-x-auto">
      <Table>
        <Thead className="text-slate-600">
          <Tr>
            <th className="px-4 py-2 text-left font-medium">채널</th>
            <th className="px-4 py-2 text-right font-medium">방문자</th>
            <th className="px-4 py-2 text-right font-medium">비율</th>
          </Tr>
        </Thead>
        <Tbody className="divide-slate-200">
          {rows.map((r) => (
            <Tr key={r.source}>
              <td className="px-4 py-2 text-slate-900">
                {LABELS[r.source] ?? r.source}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
              <td className="px-4 py-2 text-right text-slate-600 tabular-nums">
                {formatPercent(r.count, total)}
              </td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <Tr>
              <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                데이터 없음
              </td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Card>
  );
}
