import type { CustomerActionTotals } from "@/shared/lib/queries/dashboard";

interface Props {
  data: CustomerActionTotals;
}

export function CustomerActionTable({ data }: Props): React.ReactElement {
  const rows: Array<{
    label: string;
    cleaning: number;
    moving: number;
  }> = [
    {
      label: "견적",
      cleaning: data.quoteCleaning,
      moving: data.quoteMoving,
    },
    {
      label: "전화",
      cleaning: data.phoneCleaning,
      moving: data.phoneMoving,
    },
  ];

  return (
    <div className="overflow-x-auto border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-2 text-left font-medium">행동</th>
            <th className="px-4 py-2 text-right font-medium">청소</th>
            <th className="px-4 py-2 text-right font-medium">이사</th>
            <th className="px-4 py-2 text-right font-medium">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-4 py-2 text-slate-900">{r.label}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {r.cleaning}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{r.moving}</td>
              <td className="px-4 py-2 text-right font-bold tabular-nums">
                {r.cleaning + r.moving}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
