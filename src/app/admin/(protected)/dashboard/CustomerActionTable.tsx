import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr } from "@/components/ui/Table";
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
    <Card className="overflow-x-auto">
      <Table>
        <Thead className="text-slate-600">
          <Tr>
            <th className="px-4 py-2 text-left font-medium">행동</th>
            <th className="px-4 py-2 text-right font-medium">청소</th>
            <th className="px-4 py-2 text-right font-medium">이사</th>
            <th className="px-4 py-2 text-right font-medium">합계</th>
          </Tr>
        </Thead>
        <Tbody className="divide-slate-200">
          {rows.map((r) => (
            <Tr key={r.label}>
              <td className="px-4 py-2 text-slate-900">{r.label}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {r.cleaning}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{r.moving}</td>
              <td className="px-4 py-2 text-right font-bold tabular-nums">
                {r.cleaning + r.moving}
              </td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
