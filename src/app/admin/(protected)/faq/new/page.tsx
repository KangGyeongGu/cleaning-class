import { getNextFaqDisplayOrder } from "@/shared/lib/queries/faq";
import { FaqForm } from "@/app/admin/(protected)/faq/FaqForm.client";

export default async function NewFaqPage() {
  const nextDisplayOrder = await getNextFaqDisplayOrder();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <FaqForm defaultDisplayOrder={nextDisplayOrder} />
    </div>
  );
}
