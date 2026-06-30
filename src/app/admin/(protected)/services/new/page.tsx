import { getNextServiceSortOrder } from "@/shared/lib/queries/service";
import { NewServiceForm } from "@/app/admin/(protected)/services/new/NewServiceForm.client";

export default async function NewServicePage() {
  const nextSortOrder = await getNextServiceSortOrder();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">
        서비스 신규 등록
      </h1>
      <NewServiceForm defaultSortOrder={nextSortOrder} />
    </div>
  );
}
