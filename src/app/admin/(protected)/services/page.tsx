import { ManagementPage } from "@/app/admin/components/ManagementPage";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { ServiceListSection } from "@/app/admin/(protected)/services/ServiceListSection";
import { updateServiceDescription } from "@/shared/actions/site-config";

export default async function ServicesPage(): Promise<React.ReactElement> {
  return (
    <ManagementPage
      section="services"
      active="/admin/services"
      createHref="/admin/services/new"
      description={
        <AdminDescriptionSection
          label="서비스 영역 안내 문구"
          field="service_description"
          placeholder="서비스 섹션 안내 문구를 입력하세요"
          emptyText="서비스 섹션 안내 문구가 없습니다."
          onSave={updateServiceDescription}
        />
      }
    >
      <ServiceListSection />
    </ManagementPage>
  );
}
