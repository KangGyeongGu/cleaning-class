import { getAllPriceItems } from "@/shared/lib/queries/price";
import { PriceListClient } from "@/app/admin/price/PriceListClient.client";

export async function PriceListSection(): Promise<React.ReactElement> {
  const items = await getAllPriceItems();

  if (items.length === 0) {
    return (
      <div className="border border-slate-200 p-12 text-center">
        <p className="font-light text-slate-500">
          등록된 가격표 항목이 없습니다.
        </p>
      </div>
    );
  }

  return <PriceListClient items={items} />;
}
