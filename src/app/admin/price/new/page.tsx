import { getNextPriceItemSortOrder } from "@/shared/lib/queries/price";
import { NewPriceForm } from "@/app/admin/price/new/NewPriceForm.client";

export default async function NewPricePage() {
  const defaultSortOrder = await getNextPriceItemSortOrder();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">
        가격표 항목 신규 등록
      </h1>
      <NewPriceForm defaultSortOrder={defaultSortOrder} />
    </div>
  );
}
