import { getServices } from "@/shared/lib/queries/service";
import { ServiceListClient } from "@/app/admin/services/ServiceListClient.client";

export async function ServiceListSection(): Promise<React.ReactElement> {
  const servicesWithImageUrls = await getServices();

  if (servicesWithImageUrls.length === 0) {
    return (
      <div className="border border-slate-200 p-12 text-center">
        <p className="font-light text-slate-500">등록된 서비스가 없습니다.</p>
      </div>
    );
  }

  return <ServiceListClient services={servicesWithImageUrls} />;
}
