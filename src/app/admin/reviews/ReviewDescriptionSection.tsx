import { getSiteConfig } from "@/shared/lib/domain/site-config";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";
import { updateReviewDescription } from "@/shared/actions/site-config";

export async function ReviewDescriptionSection(): Promise<React.ReactElement> {
  const siteConfig = await getSiteConfig();

  return (
    <InlineDescriptionEditor
      initialValue={siteConfig?.review_description ?? ""}
      placeholder="리뷰 섹션 안내 문구를 입력하세요"
      emptyText="리뷰 섹션 안내 문구가 없습니다."
      onSave={updateReviewDescription}
    />
  );
}
