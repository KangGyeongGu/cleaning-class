import { getAllPriceItems } from "@/shared/lib/queries/price";
import { PriceListClient } from "@/app/admin/(protected)/price/PriceListClient.client";
import { EmptyState } from "@/components/ui/EmptyState";

export async function PriceListSection(): Promise<React.ReactElement> {
  const items = await getAllPriceItems();

  if (items.length === 0) {
    return <EmptyState message="등록된 가격표 항목이 없습니다." />;
  }

  return <PriceListClient items={items} />;
}
