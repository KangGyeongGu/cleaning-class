import { notFound } from "next/navigation";
import { getFaqById } from "@/shared/lib/queries/faq";
import { FaqForm } from "@/app/admin/(protected)/faq/FaqForm.client";

interface EditFaqPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const { id } = await params;
  const faq = await getFaqById(id);

  if (!faq) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <FaqForm faq={faq} />
    </div>
  );
}
