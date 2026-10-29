import { notFound } from "next/navigation";
import { getServiceById } from "@/shared/lib/queries/service";
import { ServiceForm } from "@/app/admin/(protected)/services/ServiceForm.client";

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
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <ServiceForm
        service={service}
        imageUrl={service.imageUrl}
        afterImageUrl={service.afterImageUrl}
        detailImageUrl={service.detailImageUrl}
        detailAfterImageUrl={service.detailAfterImageUrl}
      />
    </div>
  );
}
