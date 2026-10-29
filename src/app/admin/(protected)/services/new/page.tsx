import { getNextServiceSortOrder } from "@/shared/lib/queries/service";
import { ServiceForm } from "@/app/admin/(protected)/services/ServiceForm.client";

export default async function NewServicePage() {
  const nextSortOrder = await getNextServiceSortOrder();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <ServiceForm defaultSortOrder={nextSortOrder} />
    </div>
  );
}
