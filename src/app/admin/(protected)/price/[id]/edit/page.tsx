import { notFound } from "next/navigation";
import { getPriceItemById } from "@/shared/lib/queries/price";
import { PriceForm } from "@/app/admin/(protected)/price/PriceForm.client";

interface EditPricePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPricePage({ params }: EditPricePageProps) {
  const { id } = await params;
  const priceItem = await getPriceItemById(id);

  if (!priceItem) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <PriceForm priceItem={priceItem} />
    </div>
  );
}
