import { getServices } from "@/shared/lib/queries/service";
import { ServiceListClient } from "@/app/admin/(protected)/services/ServiceListClient.client";
import { EmptyState } from "@/components/ui/EmptyState";

export async function ServiceListSection(): Promise<React.ReactElement> {
  const servicesWithImageUrls = await getServices();

  if (servicesWithImageUrls.length === 0) {
    return <EmptyState message="등록된 서비스가 없습니다." />;
  }

  return <ServiceListClient services={servicesWithImageUrls} />;
}
