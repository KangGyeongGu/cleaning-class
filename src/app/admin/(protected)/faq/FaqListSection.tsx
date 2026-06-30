import { getAllFaqs } from "@/shared/lib/queries/faq";
import { FaqListClient } from "@/app/admin/(protected)/faq/FaqListClient.client";
import { EmptyState } from "@/components/ui/EmptyState";

export async function FaqListSection(): Promise<React.ReactElement> {
  const faqs = await getAllFaqs();

  if (faqs.length === 0) {
    return <EmptyState message="등록된 FAQ가 없습니다." />;
  }

  return <FaqListClient faqs={faqs} />;
}
