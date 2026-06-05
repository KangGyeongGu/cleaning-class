import type { EventCountRow } from "@/shared/lib/queries/dashboard";
import type { EventType } from "@/shared/lib/schema/analytics";

interface Props {
  rows: EventCountRow[];
}

const LABELS: Record<EventType, string> = {
  page_landing: "랜딩",
  quote_form_click: "견적 클릭",
  quote_form_success: "견적 성공",
  quote_form_error: "견적 오류",
  phone_click: "전화 클릭",
  cta_click: "CTA 클릭",
  review_card_click: "리뷰 카드 클릭",
  sns_click: "SNS 클릭",
  faq_open: "FAQ 펼침",
  review_filter: "리뷰 필터",
};

export function EventCountTable({ rows }: Props): React.ReactElement {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        이벤트 합계 (30일)
      </h2>
      <div className="overflow-x-auto border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">이벤트</th>
              <th className="px-4 py-2 text-right font-medium">발생</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.event_type}>
                <td className="px-4 py-2 text-slate-900">
                  {LABELS[r.event_type] ?? r.event_type}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={2}
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
