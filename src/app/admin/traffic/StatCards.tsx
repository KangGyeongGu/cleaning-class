interface Card {
  label: string;
  value: string;
  breakdown?: string;
}

interface Props {
  cards: Card[];
}

export function StatCards({ cards }: Props): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className="border border-slate-200 bg-white p-4">
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
        </div>
      ))}
    </div>
  );
}
