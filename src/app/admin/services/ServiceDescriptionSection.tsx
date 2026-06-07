import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";
import { updateServiceDescription } from "@/shared/actions/site-config";

export async function ServiceDescriptionSection(): Promise<React.ReactElement> {
  const siteConfig = await getSiteConfig();

  return (
    <InlineDescriptionEditor
      initialValue={siteConfig?.service_description ?? ""}
      placeholder="서비스 섹션 안내 문구를 입력하세요"
      emptyText="서비스 섹션 안내 문구가 없습니다."
      onSave={updateServiceDescription}
    />
  );
}
