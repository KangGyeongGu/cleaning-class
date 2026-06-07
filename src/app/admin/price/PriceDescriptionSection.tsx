import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";
import { updatePriceDescription } from "@/shared/actions/site-config";

export async function PriceDescriptionSection(): Promise<React.ReactElement> {
  const siteConfig = await getSiteConfig();

  return (
    <InlineDescriptionEditor
      initialValue={siteConfig?.price_description ?? ""}
      placeholder="가격표 안내 문구를 입력하세요"
      emptyText="가격표 안내 문구가 없습니다."
      onSave={updatePriceDescription}
    />
  );
}
