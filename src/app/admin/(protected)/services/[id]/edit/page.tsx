import { notFound } from "next/navigation";
import { getServiceById } from "@/shared/lib/queries/service";
import { EditServiceForm } from "@/app/admin/(protected)/services/[id]/edit/EditServiceForm.client";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">서비스 수정</h1>
      <EditServiceForm
        service={service}
        imageUrl={service.imageUrl}
        afterImageUrl={service.afterImageUrl}
        detailImageUrl={service.detailImageUrl}
        detailAfterImageUrl={service.detailAfterImageUrl}
      />
    </div>
  );
}
