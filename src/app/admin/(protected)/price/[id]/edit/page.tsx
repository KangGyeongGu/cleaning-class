import { notFound } from "next/navigation";
import { getPriceItemById } from "@/shared/lib/queries/price";
import { EditPriceForm } from "@/app/admin/(protected)/price/[id]/edit/EditPriceForm.client";

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
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">
        가격표 항목 수정
      </h1>
      <EditPriceForm priceItem={priceItem} />
    </div>
  );
}
