import { ManagementPage } from "@/app/admin/components/ManagementPage";
import { AdminDescriptionSection } from "@/app/admin/components/AdminDescriptionSection";
import { FaqListSection } from "@/app/admin/(protected)/faq/FaqListSection";
import { updateFaqDescription } from "@/shared/actions/site-config";

export default async function FaqPage(): Promise<React.ReactElement> {
  return (
    <ManagementPage
      section="services"
      active="/admin/faq"
      createHref="/admin/faq/new"
      description={
        <AdminDescriptionSection
          label="자주 묻는 질문 안내 문구"
          field="faq_description"
          placeholder="자주 묻는 질문 페이지 안내 문구를 입력하세요"
          emptyText="자주 묻는 질문 페이지 안내 문구가 없습니다."
          onSave={updateFaqDescription}
        />
      }
    >
      <FaqListSection />
    </ManagementPage>
  );
}
