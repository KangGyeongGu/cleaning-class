import { getNextPriceItemSortOrder } from "@/shared/lib/queries/price";
import { PriceForm } from "@/app/admin/(protected)/price/PriceForm.client";

export default async function NewPricePage() {
  const defaultSortOrder = await getNextPriceItemSortOrder();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <PriceForm defaultSortOrder={defaultSortOrder} />
    </div>
  );
}
