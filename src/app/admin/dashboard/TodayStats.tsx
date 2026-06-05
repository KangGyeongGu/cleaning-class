import type { TodayStats as TodayStatsData } from "@/shared/lib/queries/dashboard";

interface Props {
  data: TodayStatsData;
}

export function TodayStats({ data }: Props): React.ReactElement {
  const items: Array<{ label: string; value: number }> = [
    { label: "랜딩", value: data.landings },
    { label: "견적 클릭", value: data.quoteClicks },
    { label: "견적 성공", value: data.quoteSuccess },
    { label: "전화 클릭", value: data.phoneClicks },
  ];

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">오늘 (KST)</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {items.map((item) => (
          <div key={item.label} className="border border-slate-200 p-3 md:p-6">
            <p className="text-label mb-1 text-slate-500 md:mb-2">
              {item.label}
            </p>
            <p className="text-2xl font-black text-slate-900 md:text-4xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
