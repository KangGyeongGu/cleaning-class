import { ManagementPage } from "@/app/admin/components/ManagementPage";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { PriceListSection } from "@/app/admin/(protected)/price/PriceListSection";
import { updatePriceDescription } from "@/shared/actions/site-config";

export default async function AdminPricePage(): Promise<React.ReactElement> {
  return (
    <ManagementPage
      section="services"
      active="/admin/price"
      createHref="/admin/price/new"
      description={
        <AdminDescriptionSection
          label="가격표 안내 문구"
          field="price_description"
          placeholder="가격표 안내 문구를 입력하세요"
          emptyText="가격표 안내 문구가 없습니다."
          onSave={updatePriceDescription}
        />
      }
    >
      <PriceListSection />
    </ManagementPage>
  );
}
