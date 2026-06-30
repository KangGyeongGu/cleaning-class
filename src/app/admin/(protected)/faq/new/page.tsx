import { getNextFaqDisplayOrder } from "@/shared/lib/queries/faq";
import { NewFaqForm } from "@/app/admin/(protected)/faq/new/NewFaqForm.client";

export default async function NewFaqPage() {
  const nextDisplayOrder = await getNextFaqDisplayOrder();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">FAQ 신규 등록</h1>
      <NewFaqForm defaultDisplayOrder={nextDisplayOrder} />
    </div>
  );
}
