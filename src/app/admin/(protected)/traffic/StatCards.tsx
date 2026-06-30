import { Card } from "@/components/ui/Card";

interface StatCard {
  label: string;
  value: string;
  breakdown?: string;
}

interface Props {
  cards: StatCard[];
}

export function StatCards({ cards }: Props): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-black text-slate-900 tabular-nums md:text-2xl">
            {card.value}
          </p>
          {card.breakdown && (
            <p className="mt-0.5 text-xs font-light text-slate-400">
              {card.breakdown}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
