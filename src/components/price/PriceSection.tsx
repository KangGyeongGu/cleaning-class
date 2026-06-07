import Link from "next/link";
import { getPublishedPriceItems } from "@/shared/lib/queries/price";
import type { PriceItemRow } from "@/shared/types/database";

interface PriceRowProps {
  item: PriceItemRow;

  index: number;
}

function PriceRow({ item, index }: PriceRowProps) {
  const borderClass = [
    "border-t border-slate-100",
    index === 0 ? "border-t-0" : "",
    index === 1 ? "md:border-t-0" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const won = item.price_won;
  const href = `/contact?service=${encodeURIComponent(item.name)}`;

  return (
    <li className={borderClass}>
      <Link
        href={href}
        className="flex items-baseline justify-between gap-6 py-4 transition-colors hover:bg-slate-50 md:py-5"
      >
        <span className="text-base font-medium text-slate-700">
          {item.name}
        </span>
        {won == null ? (
          <span className="shrink-0 text-sm font-medium text-slate-400 italic">
            현장 견적
          </span>
        ) : (
          <span className="shrink-0 text-base tracking-tight text-slate-900 tabular-nums">
            <span className="font-semibold">
              {won.toLocaleString("ko-KR")}원
            </span>
            <span className="ml-0.5 font-medium text-slate-400">~</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export async function PriceSection() {
  const items = await getPublishedPriceItems();

  return (
    <>
      <section
        aria-labelledby="price-list-heading"
        className="px-6 py-12 md:py-16"
      >
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Price List
          </p>
          <h2
            id="price-list-heading"
            className="mb-10 text-3xl font-black tracking-tight text-slate-900 md:text-4xl"
          >
            서비스별 기준 요금
          </h2>

          {items.length === 0 ? (
            <div className="border-y border-slate-100 py-16 text-center">
              <p className="text-sm text-slate-400">
                가격표를 준비 중입니다.
                <br />
                자세한 요금은 견적 문의를 통해 안내해 드립니다.
              </p>
            </div>
          ) : (
            <ul
              role="list"
              className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-2 md:gap-x-12"
            >
              {items.map((item, idx) => (
                <PriceRow key={item.id} item={item} index={idx} />
              ))}
            </ul>
          )}

          <p className="mt-8 text-xs leading-relaxed text-slate-400">
            * 표기된 가격은 최소 기준 요금이며, 현장 상태 및 면적에 따라 달라질
            수 있습니다.
          </p>
        </div>
      </section>

      <section
        aria-label="견적 문의 유도"
        className="border-t border-slate-100 bg-slate-50 px-6 py-12"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Contact
          </p>
          <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            견적 문의
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-500">
            기준 요금은 참고용이며, 실제 견적은 현장 상태에 따라 달라집니다.
            <br className="hidden sm:block" />
            부담 없이 연락 주시면 빠르게 안내해 드립니다.
          </p>
          <Link
            href="/contact"
            className="btn-primary inline-block px-8 py-3 text-sm"
          >
            견적 문의하기
          </Link>
        </div>
      </section>
    </>
  );
}
