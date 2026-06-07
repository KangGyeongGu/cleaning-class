import type { TodayStats as TodayStatsData } from "@/shared/lib/queries/dashboard";

interface Props {
  data: TodayStatsData;
}

export function TodayStats({ data }: Props): React.ReactElement {
  const cards: Array<{
    label: string;
    value: number;
    breakdown?: string;
  }> = [
    {
      label: "방문자",
      value: data.visitors,
      breakdown: "외부 유입 기준",
    },
    {
      label: "견적",
      value: data.quoteSubmissions.cleaning + data.quoteSubmissions.moving,
      breakdown: `청소 ${data.quoteSubmissions.cleaning} · 이사 ${data.quoteSubmissions.moving}`,
    },
    {
      label: "전화",
      value: data.phoneClicks.cleaning + data.phoneClicks.moving,
      breakdown: `청소 ${data.phoneClicks.cleaning} · 이사 ${data.phoneClicks.moving}`,
    },
  ];

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-bold tracking-widest text-slate-500 uppercase">
        오늘 (KST 기준)
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-slate-200 bg-slate-50 p-5 md:p-6"
          >
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-4xl font-black text-slate-900 tabular-nums md:text-5xl">
              {card.value}
            </p>
            {card.breakdown && (
              <p className="mt-2 text-xs font-light text-slate-500">
                {card.breakdown}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
